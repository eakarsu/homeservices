import test,{after} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import Stripe from 'stripe'
import {prisma} from '../../src/lib/prisma'
import {billingState,plans,quotePlans,startSubscription,resumeSubscription,reconcileCheckout,subscriptionReceipt,syncSubscription,processBillingWebhook,portalSession} from '../../src/lib/workflows/software-billing'
if(!new URL(process.env.DATABASE_URL!).pathname.startsWith('/homeservices_test_'))throw Error('Use isolated test runner')
after(()=>prisma.$disconnect())
async function fixture(){const id=randomUUID(),company=await prisma.company.create({data:{name:'Billing fixture',serviceArea:[]}}),actor=await prisma.user.create({data:{companyId:company.id,email:id+'@fixture.invalid',password:'unused',firstName:'Admin',lastName:'Fixture',role:'ADMIN'}});process.env.SOFTWARE_BILLING_PLANS=JSON.stringify([{key:'team',label:'Team',priceId:'price_fixture'}]);process.env.SOFTWARE_BILLING_TAX_MODE='none-reviewed';process.env.SOFTWARE_STRIPE_WEBHOOK_SECRET='fixture-whsec';process.env.SOFTWARE_STRIPE_PORTAL_CONFIG_ID='bpc_fixture';return{user:{id:actor.id,companyId:company.id,role:'ADMIN'},company}}
function provider(){
 const suffix=randomUUID().replaceAll('-','')
 const price={id:'price_fixture',active:true,type:'recurring',unit_amount:5000,currency:'usd',billing_scheme:'per_unit',transform_quantity:null,recurring:{interval:'month',interval_count:1,usage_type:'licensed'}},sessions=new Map<string,any>(),subscriptions=new Map<string,any>(),requests=new Map<string,any>(),customerRequests=new Map<string,any>();let calls=0,failOnce=false,customerCalls=0
 const sdk=new Stripe('sk_test_fixture',{apiVersion:'2025-02-24.acacia'})
 const client={prices:{retrieve:async()=>price},customers:{create:async(params:any,opts:any)=>{customerCalls++;if(!customerRequests.has(opts.idempotencyKey))customerRequests.set(opts.idempotencyKey,{id:'cus_'+suffix+customerCalls,...params});return customerRequests.get(opts.idempotencyKey)}},checkout:{sessions:{create:async(params:any,opts:any)=>{calls++;if(requests.has(opts.idempotencyKey)){assert.deepEqual(params,requests.get(opts.idempotencyKey).params);return requests.get(opts.idempotencyKey).session}const id='cs_test_fixture'+suffix+calls,session={id,url:'https://checkout.stripe.com/c/pay/'+id,status:'open',mode:'subscription',metadata:params.metadata,client_reference_id:params.client_reference_id,customer:params.customer,subscription:null};requests.set(opts.idempotencyKey,{params,session});sessions.set(id,session);if(failOnce){failOnce=false;throw Error('Fixture uncertain response')}return session},retrieve:async(id:string)=>{if(!sessions.has(id))throw Error('Missing fixture checkout');return sessions.get(id)},expire:async(id:string)=>{const s=sessions.get(id);s.status='expired';return s}}},subscriptions:{retrieve:async(id:string)=>{if(!subscriptions.has(id))throw Error('Missing subscription');return subscriptions.get(id)}},billingPortal:{sessions:{create:async()=>({url:'https://billing.stripe.com/p/session/fixture'})}},webhooks:sdk.webhooks} as unknown as Stripe
 function complete(session:any,paid=true){const now=Math.floor(Date.now()/1000),id='sub_fixture'+suffix+sessions.size;const sub={id,metadata:session.metadata,customer:session.customer,status:'active',cancel_at_period_end:false,current_period_start:now-300,current_period_end:now+86400,items:{data:[{price,quantity:1}]},latest_invoice:{id:'in_fixture',status:paid?'paid':'open',paid,subscription:id,customer:session.customer,lines:{data:[{price,quantity:1,currency:'usd',amount:5000,period:{start:now-300,end:now+86400},subscription:id}]}}};session.status='complete';session.subscription=id;subscriptions.set(id,sub);return sub}
 return{client,price,sessions,subscriptions,requests,complete,calls:()=>calls,uncertain:()=>{failOnce=true},customerCalls:()=>customerCalls,sdk}
}
const input=()=>({planKey:'team',expectedAmountCents:5000,expectedInterval:'month',confirmed:true,requestKey:randomUUID()})
test('Software checkout validates administrator and confirmed price; concurrent requests reserve one provider checkout',async()=>{
 const f=await fixture(),p=provider(),body=input()
 assert.equal((await quotePlans(f.user,p.client))[0].amountCents,5000)
 await assert.rejects(()=>startSubscription({...f.user,role:'OFFICE'},body,p.client),/administrator/)
 await assert.rejects(()=>startSubscription(f.user,{...body,confirmed:false},p.client),/confirm/)
 await assert.rejects(()=>startSubscription(f.user,{...body,expectedAmountCents:1},p.client),/price changed/)
 const results=await Promise.allSettled([startSubscription(f.user,body,p.client),startSubscription(f.user,input(),p.client)])
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(p.calls(),1)
 const open=await prisma.softwareBillingAttempt.findFirstOrThrow({where:{companyId:f.company.id}});assert.equal(open.status,'OPEN');assert.ok(open.sessionId)
 const replay=await startSubscription(f.user,{...body,requestKey:open.requestKey},p.client);assert.ok(replay);assert.equal(p.calls(),1)
 const other=await fixture();await assert.rejects(()=>reconcileCheckout(other.user,open.sessionId!,false,p.client),/belong/)
 await reconcileCheckout(f.user,open.sessionId!,true,p.client);assert.equal((await prisma.softwareBillingAttempt.findUniqueOrThrow({where:{id:open.id}})).status,'EXPIRED')
 await prisma.user.update({where:{id:f.user.id},data:{role:'OFFICE'}})
 await assert.rejects(()=>billingState(f.user),/access changed/)
})
test('Unknown software checkouts keep stable parameters and keys; old uncertainty cannot be blindly resent',async()=>{
 const f=await fixture(),p=provider();p.uncertain();const body=input();await assert.rejects(()=>startSubscription(f.user,body,p.client),/uncertain/)
 const row=await prisma.softwareBillingAttempt.findFirstOrThrow({where:{companyId:f.company.id}});assert.equal(row.status,'UNKNOWN');assert.equal(p.requests.size,1)
 process.env.NEXTAUTH_URL='http://127.0.0.1:5555';const recovered=await resumeSubscription(f.user,row.id,p.client);assert.ok('url' in recovered);assert.equal(p.requests.size,1);assert.equal(p.customerCalls(),1)
 await reconcileCheckout(f.user,[...p.sessions.keys()][0],true,p.client)
 p.uncertain();await assert.rejects(()=>startSubscription(f.user,input(),p.client),/uncertain/);const old=await prisma.softwareBillingAttempt.findFirstOrThrow({where:{companyId:f.company.id,status:'UNKNOWN'}})
 await prisma.softwareBillingAttempt.update({where:{id:old.id},data:{createdAt:new Date(Date.now()-24*3600000)}});const count=p.calls();await assert.rejects(()=>resumeSubscription(f.user,old.id,p.client),/too old/);assert.equal(p.calls(),count)
 await reconcileCheckout(f.user,[...p.sessions.keys()][1],true,p.client)
 assert.equal((await prisma.softwareBillingAttempt.findUniqueOrThrow({where:{id:old.id}})).status,'EXPIRED')
})
test('Paid software activation requires matching current invoice; renewals, cancellation and forged callbacks retain correct state',async()=>{
 const f=await fixture(),p=provider();await startSubscription(f.user,input(),p.client);const session=[...p.sessions.values()][0],sub=p.complete(session,false)
 await reconcileCheckout(f.user,session.id,false,p.client);assert.equal((await billingState(f.user)).paid,false)
 sub.latest_invoice.status='paid';sub.latest_invoice.paid=true
 const event={id:'evt_'+randomUUID(),type:'invoice.paid',data:{object:{subscription:sub.id}}},raw=JSON.stringify(event),signature=p.sdk.webhooks.generateTestHeaderString({payload:raw,secret:'fixture-whsec'})
 await assert.rejects(()=>processBillingWebhook(raw,'forged',p.client),/signature/)
 await processBillingWebhook(raw,signature,p.client);assert.equal((await billingState(f.user)).paid,true)
 await processBillingWebhook(raw,signature,p.client);assert.equal(await prisma.softwareBillingEvent.count({where:{id:event.id}}),1)
 const changed=JSON.stringify({...event,type:'invoice.payment_failed'});await assert.rejects(()=>processBillingWebhook(changed,p.sdk.webhooks.generateTestHeaderString({payload:changed,secret:'fixture-whsec'}),p.client),/reused/)
 sub.current_period_end+=86400;assert.equal(subscriptionReceipt(sub as any).status,'UNVERIFIED')
 sub.latest_invoice.lines.data[0].period.end=sub.current_period_end;await syncSubscription(sub.id,p.client,f.user);assert.equal((await billingState(f.user)).paid,true)
 sub.cancel_at_period_end=true;await syncSubscription(sub.id,p.client,f.user);assert.equal((await billingState(f.user)).subscription?.cancelAtPeriodEnd,true);assert.equal((await billingState(f.user)).paid,true)
 assert.ok((await portalSession(f.user,p.client)).url)
 sub.status='canceled';await syncSubscription(sub.id,p.client,f.user);assert.equal((await billingState(f.user)).paid,false)
 const another=await fixture();await assert.rejects(()=>syncSubscription(sub.id,p.client,another.user),/another company/)
})
test('Software receipts reject wrong invoice identity, quantity, price and expired periods; stale RUNNING requests recover once',async()=>{
 const f=await fixture(),p=provider();await startSubscription(f.user,input(),p.client);const session=[...p.sessions.values()][0],sub=p.complete(session)
 const check=(change:(s:any)=>void)=>{const copy=structuredClone(sub);change(copy);assert.notEqual(subscriptionReceipt(copy as unknown as Stripe.Subscription).status,'ACTIVE')}
 check(s=>s.latest_invoice.customer='cus_wrong');check(s=>s.latest_invoice.subscription='sub_wrong');check(s=>s.items.data[0].quantity=2);check(s=>s.items.data[0].price.id='price_wrong');check(s=>s.current_period_end=Math.floor(Date.now()/1000)-1);check(s=>s.latest_invoice.lines.data[0].period.end=Math.floor(Date.now()/1000)-1)
 await reconcileCheckout(f.user,session.id,false,p.client);await prisma.softwareSubscription.update({where:{companyId:f.company.id},data:{paidThrough:new Date(Date.now()-1000)}});assert.equal((await billingState(f.user)).paid,false)
 process.env.SOFTWARE_BILLING_PLANS='[{"key":"team","label":"Team","priceId":"price_fixture"},{"key":"team","label":"Again","priceId":"price_second"}]';assert.throws(()=>plans(),/unique/)
 const fresh=await fixture(),q=provider();q.uncertain();await assert.rejects(()=>startSubscription(fresh.user,input(),q.client));const row=await prisma.softwareBillingAttempt.findFirstOrThrow({where:{companyId:fresh.company.id}})
 await prisma.softwareBillingAttempt.update({where:{id:row.id},data:{status:'RUNNING',updatedAt:new Date(Date.now()-180000)}});await resumeSubscription(fresh.user,row.id,q.client);assert.equal(q.requests.size,1)
 const fast=await fixture(),quick=provider(),create=quick.client.checkout.sessions.create.bind(quick.client.checkout.sessions)
 quick.client.checkout.sessions.create=(async(...args:any[])=>{const session=await (create as any)(...args);quick.complete(session);return session}) as any
 await startSubscription(fast.user,input(),quick.client);assert.equal((await billingState(fast.user)).paid,true)
})
