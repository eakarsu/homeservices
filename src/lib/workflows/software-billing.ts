import Stripe from 'stripe'
import {createHash} from 'node:crypto'
import {prisma} from '@/lib/prisma'
import type {AuthContext} from '@/lib/operations-governance'
import {audit,fail,json,text,txFor} from './core'
const TYPE='homeservices_software'
const ACTIVE=['PENDING','RUNNING','UNKNOWN','OPEN']
export function billingAdmin(user:AuthContext){if(user.role!=='ADMIN')fail('A company administrator must manage software billing',403)}
export function softwareStripe(){if(!process.env.SOFTWARE_STRIPE_SECRET_KEY)fail('Software billing Stripe is not configured',503);return new Stripe(process.env.SOFTWARE_STRIPE_SECRET_KEY!,{apiVersion:'2025-02-24.acacia',timeout:20000,maxNetworkRetries:0})}
export function plans():{key:string;label:string;priceId:string}[]{
 let value:unknown;try{value=JSON.parse(process.env.SOFTWARE_BILLING_PLANS||'[]')}catch{fail('Software plan configuration is invalid',503)}
 if(!Array.isArray(value)||value.length>10)fail('Software plan configuration is invalid',503)
 const result=value.map(p=>{if(!p||typeof p!=='object'||typeof p.key!=='string'||!/^[-a-z0-9]{1,40}$/.test(p.key)||typeof p.label!=='string'||!p.label.trim()||p.label.length>100||typeof p.priceId!=='string'||!/^price_[a-zA-Z0-9]+$/.test(p.priceId))fail('Software plan configuration is invalid',503);return{key:p.key,label:p.label,priceId:p.priceId}})
 if(new Set(result.map(p=>p.key)).size!==result.length||new Set(result.map(p=>p.priceId)).size!==result.length)fail('Software plans require unique keys and prices',503)
 return result
}
function origin(){const url=new URL(process.env.NEXTAUTH_URL||'http://invalid');if(url.username||url.password||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))))fail('Configure the software billing return URL',503);return url.origin}
function ref(value:unknown):string|undefined{return typeof value==='string'?value:value&&typeof value==='object'&&'id'in value?String(value.id):undefined}
function validPrice(price:Stripe.Price){if(!price.active||price.type!=='recurring'||price.currency!=='usd'||!price.unit_amount||!Number.isSafeInteger(price.unit_amount)||price.unit_amount>100000000||price.billing_scheme!=='per_unit'||price.transform_quantity||!['month','year'].includes(price.recurring?.interval||'')||price.recurring?.interval_count!==1||price.recurring.usage_type!=='licensed')fail('Software price must be an active fixed USD monthly or yearly price',503);return price}
export async function quotePlans(user:AuthContext,client=softwareStripe()){
 billingAdmin(user);await txFor(user,async()=>{});return Promise.all(plans().map(async p=>{const price=validPrice(await client.prices.retrieve(p.priceId));return{...p,amountCents:price.unit_amount!,currency:price.currency,interval:price.recurring!.interval,taxBehavior:price.tax_behavior}}))
}
export async function billingState(user:AuthContext){billingAdmin(user);return txFor(user,async tx=>{const subscription=await tx.softwareSubscription.findUnique({where:{companyId:user.companyId}}),attempts=await tx.softwareBillingAttempt.findMany({where:{companyId:user.companyId},orderBy:{createdAt:'desc'},take:30,select:{id:true,planKey:true,priceId:true,amountCents:true,interval:true,status:true,sessionId:true,error:true,createdAt:true,updatedAt:true}});return{subscription,paid:Boolean(subscription?.status==='ACTIVE'&&subscription.paidThrough&&subscription.paidThrough>new Date()),attempts,plans:plans(),configured:Boolean(process.env.SOFTWARE_STRIPE_SECRET_KEY),taxMode:process.env.SOFTWARE_BILLING_TAX_MODE||'unconfigured',portalConfigured:Boolean(process.env.SOFTWARE_STRIPE_PORTAL_CONFIG_ID)}})}
export async function startSubscription(user:AuthContext,body:Record<string,unknown>,client=softwareStripe()){
 billingAdmin(user);const key=text(body.requestKey,'request key',128),planKey=text(body.planKey,'plan',40)
 if(!/^[\w:-]{8,128}$/.test(key)||body.confirmed!==true)fail('Review the recurring price and confirm before checkout')
 const plan=plans().find(p=>p.key===planKey);if(!plan)fail('Select a configured plan')
 const tax=process.env.SOFTWARE_BILLING_TAX_MODE;if(!['automatic','none-reviewed'].includes(tax||''))fail('Review and configure software billing tax mode',503)
 const price=validPrice(await client.prices.retrieve(plan.priceId));if(body.expectedAmountCents!==price.unit_amount||body.expectedInterval!==price.recurring!.interval)fail('Plan price changed; load the current price before confirming',409)
 const base=origin()
 const row=await txFor(user,async tx=>{
  const old=await tx.softwareBillingAttempt.findUnique({where:{companyId_requestKey:{companyId:user.companyId,requestKey:key}}})
  if(old){if(old.actorId!==user.id||old.planKey!==planKey||old.priceId!==plan.priceId||old.amountCents!==body.expectedAmountCents||old.interval!==body.expectedInterval)fail('Retry key belongs to another billing request',409);return old}
  const current=await tx.softwareSubscription.upsert({where:{companyId:user.companyId},create:{companyId:user.companyId},update:{}})
  if(current.subscriptionId&&!['CANCELED','INCOMPLETE_EXPIRED'].includes(current.status))fail('Manage or refresh the existing subscription before another checkout',409)
  if(await tx.softwareBillingAttempt.findFirst({where:{companyId:user.companyId,status:{in:ACTIVE}}}))fail('Resolve the existing software checkout before creating another',409)
  const company=await tx.company.findUniqueOrThrow({where:{id:user.companyId}})
  const result=await tx.softwareBillingAttempt.create({data:{companyId:user.companyId,actorId:user.id,requestKey:key,planKey,priceId:plan.priceId,amountCents:price.unit_amount!,interval:price.recurring!.interval,customerId:current.customerId,customerName:company.name}})
  const metadata={type:TYPE,companyId:user.companyId,attemptId:result.id}
  await tx.softwareBillingAttempt.update({where:{id:result.id},data:{params:json({mode:'subscription',line_items:[{price:plan.priceId,quantity:1}],client_reference_id:user.companyId,metadata,subscription_data:{metadata},automatic_tax:{enabled:tax==='automatic'},billing_address_collection:'required',customer_update:{address:'auto'},success_url:base+'/dashboard/billing?checkout={CHECKOUT_SESSION_ID}',cancel_url:base+'/dashboard/billing?checkout=cancelled'})}})
  await audit(tx,user,'software.checkout.reserve','SoftwareBillingAttempt',result.id,{planKey,priceId:plan.priceId,amountCents:price.unit_amount,interval:price.recurring!.interval,taxMode:tax,confirmed:true})
  return result
 })
 return resumeSubscription(user,row.id,client)
}
export async function resumeSubscription(user:AuthContext,id:string,client=softwareStripe()){
 billingAdmin(user)
 const row=await txFor(user,async tx=>{
  const current=await tx.softwareBillingAttempt.findFirst({where:{id,companyId:user.companyId}});if(!current)fail('Software checkout not found',404)
  if(current.sessionId)return current
  if(current.status==='RUNNING'&&current.updatedAt.getTime()>Date.now()-120000)fail('Checkout is being processed; refresh before retrying',409)
  if(!['PENDING','UNKNOWN','RUNNING'].includes(current.status))fail('This checkout is closed',409)
  if(current.createdAt.getTime()<Date.now()-23*3600000)fail('This uncertain checkout is too old to resend safely. Reconcile its provider reference.',409)
  await tx.softwareBillingAttempt.update({where:{id},data:{status:'RUNNING',error:null}});return current
 })
 if(row.sessionId)return reconcileCheckout(user,row.sessionId,false,client)
 try{
  let customerId=row.customerId
  if(!customerId){const customer=await client.customers.create({name:row.customerName,metadata:{type:TYPE,companyId:user.companyId}},{idempotencyKey:'home-software-customer:'+row.id});if(!customer.id||customer.metadata.companyId!==user.companyId||customer.metadata.type!==TYPE)fail('Customer receipt does not match',502);customerId=customer.id
   await txFor(user,async tx=>{const stored=await tx.softwareSubscription.findUniqueOrThrow({where:{companyId:user.companyId}});if(stored.customerId&&stored.customerId!==customer.id)fail('Software customer changed',409);await tx.softwareSubscription.update({where:{companyId:user.companyId},data:{customerId:customer.id}});await tx.softwareBillingAttempt.update({where:{id},data:{customerId:customer.id}})})
  }
  // Stored parameters remain stable across provider retries and configuration changes.
  const session=await client.checkout.sessions.create({...row.params as unknown as Stripe.Checkout.SessionCreateParams,customer:customerId},{idempotencyKey:'home-software-checkout:'+row.id})
  if(session.metadata?.type!==TYPE||session.metadata.companyId!==user.companyId||session.metadata.attemptId!==id||ref(session.customer)!==customerId||session.mode!=='subscription')fail('Checkout receipt does not match',502)
  await txFor(user,async tx=>{await tx.softwareBillingAttempt.update({where:{id},data:{sessionId:session.id,status:session.status==='expired'?'EXPIRED':'OPEN',error:null}})})
  return reconcileCheckout(user,session.id,false,client)
 }catch(error){await prisma.softwareBillingAttempt.updateMany({where:{id,status:'RUNNING'},data:{status:'UNKNOWN',error:'Provider outcome is uncertain; use the same saved checkout or reconcile its reference.'}});throw error}
}
// A verified provider read is required even when a browser returns from Checkout.
export async function reconcileCheckout(user:AuthContext,sessionId:string,expire=false,client=softwareStripe()){
 billingAdmin(user);if(!/^cs_[A-Za-z0-9_]+$/.test(sessionId))fail('Invalid checkout reference')
 await txFor(user,async()=>{});let session=await client.checkout.sessions.retrieve(sessionId)
 const attempt=await txFor(user,async tx=>{
  const row=await tx.softwareBillingAttempt.findFirst({where:{id:session.metadata?.attemptId||'',companyId:user.companyId}}),stored=await tx.softwareSubscription.findUnique({where:{companyId:user.companyId}})
  if(!row||session.metadata?.type!==TYPE||session.metadata.companyId!==user.companyId||session.client_reference_id!==user.companyId||session.mode!=='subscription'||ref(session.customer)!==stored?.customerId||ref(session.customer)!==row.customerId||(row.sessionId&&row.sessionId!==sessionId))fail('Checkout does not belong to this company',403)
  return row
 })
 if(expire&&session.status==='open'){session=await client.checkout.sessions.expire(sessionId);if(session.id!==sessionId||session.status!=='expired')fail('Checkout expiration was not confirmed',409)}
 if(session.status==='complete'){
  if(!ref(session.subscription))fail('Completed checkout has no subscription receipt',409)
  await syncSubscription(ref(session.subscription)!,client,user)
 }
 await txFor(user,async tx=>{await tx.softwareBillingAttempt.update({where:{id:attempt.id},data:{sessionId,status:session.status==='expired'?'EXPIRED':session.status==='complete'?'COMPLETE':'OPEN',error:null}})})
 if(session.status==='open'&&session.url){const url=new URL(session.url);if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')fail('Unexpected checkout destination',502);return{url:session.url,status:'OPEN'}}
 return{status:session.status}
}
export function subscriptionReceipt(sub:Stripe.Subscription){
 const item=sub.items.data[0],price=item?.price,plan=plans().find(p=>p.priceId===price?.id),invoice=typeof sub.latest_invoice==='object'?sub.latest_invoice:null,now=Math.floor(Date.now()/1000)
 const valid=plan&&sub.items.data.length===1&&item.quantity===1&&price.currency==='usd'&&price.recurring?.interval_count===1&&['month','year'].includes(price.recurring.interval)&&price.billing_scheme==='per_unit'&&!price.transform_quantity
 const line=invoice?.lines.data.find(l=>ref(l.price)===price?.id&&l.quantity===1&&l.currency==='usd'&&l.amount>=0&&l.period.start<=sub.current_period_start&&l.period.end>=sub.current_period_end&&ref(l.subscription)===sub.id)
 const paid=valid&&sub.status==='active'&&invoice?.status==='paid'&&invoice.paid&&ref(invoice.subscription)===sub.id&&ref(invoice.customer)===ref(sub.customer)&&line&&sub.current_period_start<=now&&sub.current_period_end>now
 return{planKey:plan?.key??null,priceId:price?.id??null,status:paid?'ACTIVE':sub.status==='canceled'?'CANCELED':sub.status==='incomplete_expired'?'INCOMPLETE_EXPIRED':sub.status==='trialing'?'TRIALING':'UNVERIFIED',paidThrough:paid?new Date(sub.current_period_end*1000):null,periodStart:sub.current_period_start?new Date(sub.current_period_start*1000):null,cancelAtPeriodEnd:sub.cancel_at_period_end,checkedAt:new Date()}
}
export async function syncSubscription(id:string,client=softwareStripe(),actor?:AuthContext){
 if(!/^sub_[A-Za-z0-9]+$/.test(id))fail('Invalid subscription reference')
 const hint=await client.subscriptions.retrieve(id);if(hint.metadata.type!==TYPE||!hint.metadata.companyId)return false
 if(actor){billingAdmin(actor);if(actor.companyId!==hint.metadata.companyId)fail('Subscription belongs to another company',403)}
 return prisma.$transaction(async tx=>{
  const companyId=hint.metadata.companyId;await tx.$queryRaw`SELECT id FROM "Company" WHERE id=${companyId} FOR UPDATE`
  if(actor){const current=await tx.user.findFirst({where:{id:actor.id,companyId,isActive:true,role:'ADMIN'}});if(!current)fail('Administrator access changed',403)}
  const stored=await tx.softwareSubscription.findUnique({where:{companyId}}),sub=await client.subscriptions.retrieve(id,{expand:['latest_invoice']})
  if(!stored||sub.metadata.type!==TYPE||sub.metadata.companyId!==companyId||ref(sub.customer)!==stored.customerId)fail('Subscription receipt does not match this company',409)
  if(stored.subscriptionId&&stored.subscriptionId!==id&&!['CANCELED','INCOMPLETE_EXPIRED'].includes(stored.status))return false
  const attempt=await tx.softwareBillingAttempt.findFirst({where:{id:sub.metadata.attemptId||'',companyId,customerId:stored.customerId}})
  if(!attempt)fail('Subscription has no authorized checkout reservation',409)
  if(stored.subscriptionId!==id&&(sub.items.data.length!==1||sub.items.data[0].price.id!==attempt.priceId||sub.items.data[0].price.unit_amount!==attempt.amountCents||!ACTIVE.includes(attempt.status)))return false
  const state=subscriptionReceipt(sub)
  await tx.softwareSubscription.update({where:{companyId},data:{...state,subscriptionId:id}})
  await tx.softwareBillingAttempt.update({where:{id:attempt.id},data:{status:'COMPLETE'}})
  return true
 },{timeout:30000,maxWait:10000})
}
export async function portalSession(user:AuthContext,client=softwareStripe()){
 billingAdmin(user);const config=process.env.SOFTWARE_STRIPE_PORTAL_CONFIG_ID;if(!config||!/^bpc_[A-Za-z0-9]+$/.test(config))fail('Configure the software billing customer portal',503)
 const state=await txFor(user,async tx=>{const row=await tx.softwareSubscription.findUnique({where:{companyId:user.companyId}});if(!row?.customerId||!row.subscriptionId)fail('A software subscription is required',409);return row})
 const session=await client.billingPortal.sessions.create({customer:state.customerId!,configuration:config,return_url:origin()+'/dashboard/billing'})
 const url=new URL(session.url);if(url.protocol!=='https:'||url.hostname!=='billing.stripe.com')fail('Unexpected billing portal destination',502)
 await txFor(user,async tx=>audit(tx,user,'software.portal.open','SoftwareSubscription',user.companyId,{configuration:config}));return{url:session.url}
}
export async function processBillingWebhook(raw:string,signature:string,client=softwareStripe()){
 if(Buffer.byteLength(raw)>250000)fail('Webhook too large',413)
 const secret=process.env.SOFTWARE_STRIPE_WEBHOOK_SECRET;if(!secret)fail('Software webhook secret is not configured',503)
 let event:Stripe.Event;try{event=client.webhooks.constructEvent(raw,signature,secret)}catch{fail('Invalid software webhook signature',400)}
 const hash=createHash('sha256').update(raw).digest('hex'),old=await prisma.softwareBillingEvent.findUnique({where:{id:event.id}})
 if(old){if(old.payloadHash!==hash)fail('Webhook ID was reused with different data',409);return{received:true}}
 const data=event.data.object as unknown as Record<string,unknown>
 let id:string|undefined;if(event.type.startsWith('customer.subscription.'))id=ref(data);else if(event.type.startsWith('invoice.')||event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded')id=ref(data.subscription)
 if(id)await syncSubscription(id,client)
 const receipt=await prisma.softwareBillingEvent.upsert({where:{id:event.id},create:{id:event.id,payloadHash:hash},update:{}})
 if(receipt.payloadHash!==hash)fail('Webhook ID was reused with different data',409)
 return{received:true}
}
