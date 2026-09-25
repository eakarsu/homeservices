export const OFFLINE_DB='homeservices-field-v1'
export async function saveOfflineDraft(draft: Record<string,unknown>) {
  return new Promise<void>((resolve,reject)=>{
    const request=indexedDB.open(OFFLINE_DB,1)
    request.onupgradeneeded=()=>request.result.createObjectStore('drafts',{keyPath:'id'})
    request.onerror=()=>reject(request.error)
    request.onsuccess=()=>{const db=request.result,tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(draft);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}}
  })
}
