export const OFFLINE_DB = 'homeservices-field-v1'
export const OFFLINE_OWNER_KEY = 'homeservices-field-owner'

export type OfflineFieldDraft = {
  id: string
  ownerId: string
  companyId: string
  technicianId: string
  jobId: string
  title: string
  createdAt: string
  requestKey: string
  state: 'pending'
  essentials: {
    jobNumber: string
    title: string
    tradeType: string
    status: string
    scheduledStart: string | null
    address: string
    scope: string
  }
  payload: Record<string, unknown>
}

/** One draft per assigned job prevents a second queued copy from overwriting work. */
export async function saveOfflineDraft(draft: OfflineFieldDraft) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'id' })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('drafts', 'readwrite')
      const store = tx.objectStore('drafts')
      let duplicate = false
      const read = store.getAll()
      read.onsuccess = () => {
        duplicate = (read.result as OfflineFieldDraft[]).some(row => row.ownerId === draft.ownerId && row.companyId === draft.companyId && row.jobId === draft.jobId)
        if (duplicate) tx.abort()
        else store.add(draft)
      }
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onabort = () => { db.close(); reject(duplicate ? Error('A local draft for this assigned job already exists. Sync or delete it in the offline notebook first.') : tx.error) }
      tx.onerror = () => { db.close(); reject(tx.error) }
    }
  })
}
