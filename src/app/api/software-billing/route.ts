import {NextRequest} from 'next/server'
import {bodyFor,fail,handle,text} from '@/lib/workflows/core'
import {billingState,portalSession,quotePlans,reconcileCheckout,resumeSubscription,softwareStripe,startSubscription,syncSubscription} from '@/lib/workflows/software-billing'
export const dynamic='force-dynamic'
export const GET=(request:NextRequest)=>handle(request,async user=>billingState(user))
export const POST=(request:NextRequest)=>handle(request,async user=>{
 const body=await bodyFor(request)
 switch(body.action){
  case 'PRICES':return{plans:await quotePlans(user)}
  case 'CHECKOUT':return startSubscription(user,{...body,requestKey:request.headers.get('Idempotency-Key')})
  case 'RESUME':return resumeSubscription(user,text(body.id,'checkout',100))
  case 'RECONCILE':return reconcileCheckout(user,text(body.sessionId,'provider checkout',200))
  case 'EXPIRE':if(body.confirmed!==true)fail('Confirm checkout expiration');return reconcileCheckout(user,text(body.sessionId,'provider checkout',200),true)
  case 'PORTAL':return portalSession(user)
  case 'REFRESH':{const state=await billingState(user);if(state.subscription?.subscriptionId)await syncSubscription(state.subscription.subscriptionId,softwareStripe(),user);return billingState(user)}
  default:fail('Unknown billing action')
 }
})
