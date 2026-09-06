import {readFileSync} from 'node:fs'
import {query,executeScript} from './db.mjs'
const migrations=[
 ['20251203123121_init','Company'],
 ['20260720000000_governed_estimates','AuditEvent'],
 ['20260905000000_follow_up_tasks','FollowUpTask'],
 ['20260906000000_operations_expansion','WorkflowMutation'],
 ['20260906010000_assistant_delivery','AssistantRequest'],
 ['20260906020000_invoice_integrity','InvoiceCredit'],
 ['20260906030000_refund_settlement',null],
 ['20260906040000_verified_payment_receipts','@payment_receipt'],
 ['20260906050000_software_billing','SoftwareSubscription']
]
for(const [name,table] of migrations){const check=table==='@payment_receipt'?`SELECT to_regclass('public."Payment_verified_stripe_receipt"') IS NOT NULL`:table?`SELECT to_regclass('public."${table}"') IS NOT NULL`:`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='PaymentRefund' AND column_name='settledAt')`;if(query(check,{rows:true})==='t')continue;const sql=readFileSync(new URL(`../prisma/migrations/${name}/migration.sql`,import.meta.url),'utf8');executeScript('BEGIN;\n'+sql+'\nCOMMIT;');console.log(`Applied ${name}`)}
console.log('Application migrations are present. Existing rows were retained.')
