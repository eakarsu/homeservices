import type { AuthContext } from '@/lib/operations-governance'
import { audit, fail, jobFor, object, text, txFor } from './core'
import { execution, updateJob } from './execution'
export async function syncOfflineJob(user: AuthContext, jobId: string, body: Record<string,unknown>) {
  if (body.ownerId !== user.id) fail('Sign in with the account that saved this offline draft',403)
  if (body.reviewed !== true) fail('Review the offline work before synchronization')
  return txFor(user, async tx => {
    const job = await jobFor(tx,user,jobId)
    if (text(body.updatedAt,'original job version',50) !== job.updatedAt.toISOString()) fail('The job changed while offline. Keep this draft and compare it with the current job before saving.',409)
    if (!Array.isArray(body.photos) || body.photos.length > 5) fail('Use up to five photos per offline draft')
    const saved = await updateJob(user,jobId,{updatedAt:body.updatedAt,workPerformed:body.workPerformed})
    if (body.items) await execution(user,jobId,{items:body.items,version:body.checklistVersion},'checklist')
    for (const raw of body.photos) await execution(user,jobId,{...object(raw),consent:body.photoConsent === true},'photo')
    await audit(tx,user,'OFFLINE_WORK_SYNCED','Job',jobId,{photoCount:body.photos.length})
    return {synced:true,updatedAt:saved.updatedAt}
  })
}
