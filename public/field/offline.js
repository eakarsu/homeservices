(() => {
  'use strict';
  const DB = 'homeservices-field-v1';
  const OWNER_KEY = 'homeservices-field-owner';
  const MAX_PHOTOS = 5;
  const MAX_PHOTO_BYTES = 750000;
  const root = document.getElementById('drafts');
  const notice = document.getElementById('notice');
  const summary = document.getElementById('summary');
  const connection = document.getElementById('connection');
  const marker = localStorage.getItem(OWNER_KEY) || sessionStorage.getItem(OWNER_KEY) || '';
  const colon = marker.indexOf(':');
  const companyId = colon < 0 ? '' : marker.slice(0, colon);
  const ownerId = colon < 0 ? marker : marker.slice(colon + 1);
  let db;

  function el(tag, value) {
    const result = document.createElement(tag);
    if (value !== undefined) result.textContent = value;
    return result;
  }
  function show(message) { notice.textContent = message || ''; }
  function stored(mode, operation) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', mode);
      const request = operation(tx.objectStore('drafts'));
      let value;
      request.onsuccess = () => { value = request.result; };
      tx.oncomplete = () => resolve(value);
      tx.onabort = () => reject(tx.error || Error('Device storage unavailable'));
      tx.onerror = () => reject(tx.error || Error('Device storage unavailable'));
    });
  }
  const save = draft => stored('readwrite', store => store.put(draft));
  const remove = draft => stored('readwrite', store => store.delete(draft.id));
  const all = () => stored('readonly', store => store.getAll());
  const own = draft => draft.ownerId === ownerId && (!companyId || !draft.companyId || draft.companyId === companyId);
  const date = value => {
    if (!value) return 'Not scheduled';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Date unavailable' : parsed.toLocaleString();
  };
  const stateText = {
    pending: 'Pending on this device — not sent',
    uncertain: 'Sync result unknown — retry this exact request',
    conflict: 'Conflict — compare this draft with the current job',
    blocked: 'Blocked — access or input needs attention',
  };
  function checklistShapeMatches(draftItems, currentItems) {
    return Array.isArray(draftItems) && Array.isArray(currentItems) &&
      draftItems.length === currentItems.length &&
      draftItems.every((item, index) => item.id === currentItems[index].id && item.label === currentItems[index].label);
  }
  function photoBytes(photos) {
    return photos.reduce((sum, photo) => sum + Math.ceil((String(photo.media || '').split(',')[1] || '').length * 3 / 4), 0);
  }
  function readDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || Error('Photo could not be read'));
      reader.readAsDataURL(file);
    });
  }
  async function render() {
    connection.textContent = navigator.onLine ? 'Connected. Review and sync pending drafts.' : 'Offline. Changes remain on this device.';
    root.replaceChildren();
    if (!ownerId) {
      summary.textContent = 'Open an assigned job while connected and select “Save assigned job for offline work” first.';
      return;
    }
    const rows = (await all()).filter(own).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const counts = { pending: 0, uncertain: 0, conflict: 0, blocked: 0 };
    for (const draft of rows) counts[draft.state in counts ? draft.state : 'pending'] += 1;
    summary.textContent = `${counts.pending} pending · ${counts.uncertain} uncertain · ${counts.conflict} conflicts · ${counts.blocked} blocked`;
    if (!rows.length) root.append(el('p', 'No local drafts for this account. Open an assigned job while connected to save one.'));
    for (const draft of rows) root.append(buildCard(draft));
  }

  function buildCard(draft) {
    draft.state = draft.state || 'pending';
    draft.essentials = draft.essentials || { jobNumber: '', title: draft.title || 'Job', tradeType: '', status: '', scheduledStart: null, address: '', scope: '' };
    draft.payload = draft.payload || {};
    draft.payload.photos = Array.isArray(draft.payload.photos) ? draft.payload.photos : [];
    const card = el('article');
    const title = el('h2', `${draft.essentials.jobNumber || 'Job'} · ${draft.essentials.title || draft.title}`);
    const status = el('p', stateText[draft.state] || stateText.pending);
    status.className = 'state';
    const detail = el('p', draft.error || '');
    detail.className = draft.error ? 'error' : 'muted';
    const essentials = el('p', `${draft.essentials.tradeType || 'Service'} · ${date(draft.essentials.scheduledStart)} · ${draft.essentials.status || 'Status unavailable'}`);
    const address = el('p', draft.essentials.address || 'Address not recorded');
    const scope = el('p', draft.essentials.scope || 'No scope description recorded');
    const saved = el('p', `Saved on this device ${date(draft.createdAt)}`);
    saved.className = 'muted';
    card.append(title, status, detail, essentials, address, scope, saved);
    const controls = [];
    let saving = Promise.resolve();
    function persistChanged() {
      if (draft.state === 'uncertain') return;
      const wasConflict = draft.state === 'conflict';
      draft.requestKey = crypto.randomUUID();
      draft.state = wasConflict ? 'conflict' : 'pending';
      draft.error = '';
      draft.payload.reviewed = false;
      status.textContent = stateText[draft.state];
      detail.textContent = '';
      saving = saving.then(() => save(draft)).catch(error => show(error.message || 'Device save failed'));
    }
    const workLabel = el('label', 'Work notes queued for this job');
    const work = el('textarea');
    work.value = draft.payload.workPerformed || '';
    work.maxLength = 20000;
    work.disabled = draft.state === 'uncertain';
    work.oninput = () => { draft.payload.workPerformed = work.value; persistChanged(); };
    workLabel.append(work);
    card.append(workLabel);
    controls.push(work);

    for (const item of draft.payload.items || []) {
      const label = el('label');
      const checked = el('input');
      checked.type = 'checkbox';
      checked.checked = Boolean(item.checked);
      checked.disabled = draft.state === 'uncertain';
      checked.onchange = () => { item.checked = checked.checked; persistChanged(); };
      const note = el('input');
      note.value = item.notes || '';
      note.maxLength = 2000;
      note.placeholder = 'Checklist evidence';
      note.setAttribute('aria-label', `${item.label} evidence`);
      note.disabled = draft.state === 'uncertain';
      note.oninput = () => { item.notes = note.value; persistChanged(); };
      label.append(checked, document.createTextNode(` ${item.label} `), note);
      card.append(label);
      controls.push(checked, note);
    }

    const fileLabel = el('label', 'Add PNG or JPEG evidence (up to five, 750 KB total)');
    const file = el('input');
    file.type = 'file';
    file.accept = 'image/png,image/jpeg';
    file.multiple = true;
    file.disabled = draft.state === 'uncertain';
    file.onchange = async () => {
      try {
        let bytes = photoBytes(draft.payload.photos);
        const additions = [];
        for (const selected of file.files || []) {
          if (!['image/png', 'image/jpeg'].includes(selected.type)) throw Error('Use PNG or JPEG photos');
          bytes += selected.size;
          if (bytes > MAX_PHOTO_BYTES || draft.payload.photos.length + additions.length >= MAX_PHOTOS) throw Error('Use up to five photos totaling 750 KB');
          const media = await readDataUrl(selected);
          additions.push({ media, type: 'DURING', caption: selected.name.slice(0, 1000) });
        }
        draft.payload.photos.push(...additions);
        persistChanged();
        await saving;
        await render();
      } catch (error) { show(error.message || 'Photo could not be saved'); }
    };
    fileLabel.append(file);
    card.append(fileLabel);
    controls.push(file);
    for (const [index, photo] of draft.payload.photos.entries()) {
      const image = el('img');
      image.src = photo.media;
      image.alt = photo.caption || 'Queued job photo';
      const removePhoto = el('button', 'Remove photo');
      removePhoto.disabled = draft.state === 'uncertain';
      removePhoto.onclick = async () => {
        draft.payload.photos.splice(index, 1);
        persistChanged();
        await saving;
        await render();
      };
      card.append(image, removePhoto);
      controls.push(removePhoto);
    }
    const consentLabel = el('label');
    const consent = el('input');
    consent.type = 'checkbox';
    consent.checked = Boolean(draft.payload.photoConsent);
    consent.disabled = draft.state === 'uncertain';
    consent.onchange = () => { draft.payload.photoConsent = consent.checked; persistChanged(); };
    consentLabel.append(consent, document.createTextNode(' I am authorized to store these job photos.'));
    card.append(consentLabel);
    controls.push(consent);

    const sync = el('button', draft.state === 'uncertain' ? 'Retry exact sync request' : 'Review complete — sync draft');
    sync.disabled = !navigator.onLine || draft.state === 'conflict';
    const discard = el('button', 'Delete local draft');
    const compare = el('button', 'Compare with current job');
    compare.hidden = draft.state !== 'conflict';
    controls.push(sync, discard, compare);
    let inFlight = false;
    sync.onclick = async () => {
      if (inFlight) return;
      inFlight = true;
      controls.forEach(control => { control.disabled = true; });
      let posted = false;
      let completed = false;
      try {
        await saving;
        if (!navigator.onLine) throw Error('Still offline. Draft remains pending.');
        if (draft.payload.photos.length && !draft.payload.photoConsent) throw Error('Confirm photo authorization before syncing.');
        const authResponse = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!authResponse.ok) throw Error('Sign in online before syncing. Draft retained.');
        const session = await authResponse.json();
        if (session.user?.id !== draft.ownerId || (draft.companyId && session.user?.companyId !== draft.companyId) || session.user?.role !== 'TECHNICIAN')
          throw Error('Sign in as the original technician at the original company. Draft retained.');
        if (draft.state !== 'uncertain') draft.payload.reviewed = true;
        // Persist "uncertain" before the request so a closed tab retries the
        // identical key and body if the server committed without a response.
        draft.state = 'uncertain';
        draft.error = 'Awaiting server confirmation';
        await save(draft);
        posted = true;
        const response = await fetch(`/api/jobs/${encodeURIComponent(draft.jobId)}/offline-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': draft.requestKey },
          body: JSON.stringify(draft.payload),
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result?.synced === true) {
          await remove(draft);
          completed = true;
          show('Work synchronized with the assigned job. This device copy was deleted.');
          return;
        }
        draft.error = result?.error || `Sync returned ${response.status}; draft retained.`;
        if (response.status === 409 && !/retry key/i.test(draft.error)) draft.state = 'conflict';
        else if ([400, 401, 403, 404, 413, 422].includes(response.status) || /retry key/i.test(draft.error)) draft.state = 'blocked';
        else draft.state = 'uncertain';
      } catch (error) {
        draft.state = posted ? 'uncertain' : 'pending';
        draft.error = error.message || 'Sync outcome unknown. Draft retained.';
      } finally {
        if (!completed) await save(draft).catch(error => show(error.message || 'Device save failed'));
        inFlight = false;
        await render().catch(error => show(error.message || 'Draft view unavailable'));
      }
    };
    compare.onclick = async () => {
      try {
        await saving;
        const [jobResponse, evidenceResponse] = await Promise.all([
          fetch(`/api/jobs/${encodeURIComponent(draft.jobId)}`, { cache: 'no-store' }),
          fetch(`/api/jobs/${encodeURIComponent(draft.jobId)}/execution`, { cache: 'no-store' }),
        ]);
        if (!jobResponse.ok || !evidenceResponse.ok) throw Error('Current assigned job cannot be read. Keep this draft and contact the office.');
        const job = await jobResponse.json();
        const evidence = await evidenceResponse.json();
        const currentItems = evidence.checklist?.items || [];
        const sameShape = checklistShapeMatches(draft.payload.items || [], currentItems);
        const open = !['COMPLETED', 'INVOICED', 'CANCELLED'].includes(job.status);
        const panel = el('div');
        panel.className = 'comparison';
        panel.append(el('h3', 'Compare before resubmitting'));
        panel.append(el('p', `Server status: ${job.status}. Server work notes: ${job.workPerformed || '(none)'}`));
        panel.append(el('p', `Queued work notes: ${draft.payload.workPerformed || '(none)'}`));
        panel.append(el('p', `Current checklist: ${currentItems.map(item => `${item.label}: ${item.checked ? 'done' : 'open'}`).join('; ') || '(none)'}`));
        if (!sameShape || !open) panel.append(el('p', 'The job is closed or checklist requirements changed. Keep this draft and ask the office to reconcile it.'));
        else {
          const rebase = el('button', 'I compared both records — use current version');
          rebase.onclick = async () => {
            if (!confirm('Apply this queued draft over the current job notes and checklist after reviewing both versions?')) return;
            draft.payload.updatedAt = job.updatedAt;
            draft.payload.checklistVersion = evidence.checklist?.version;
            draft.payload.reviewed = false;
            draft.requestKey = crypto.randomUUID();
            draft.state = 'pending';
            draft.error = '';
            await save(draft);
            show('Draft rebased. Review it again before syncing.');
            await render();
          };
          panel.append(rebase);
        }
        card.append(panel);
      } catch (error) { show(error.message || 'Unable to compare current job'); }
    };
    discard.onclick = async () => {
      const warning = draft.state === 'uncertain'
        ? 'The server may have saved this draft. Deleting this device copy cannot undo that work. Delete anyway?'
        : 'Delete this local draft? Unsynced work will be lost.';
      if (!confirm(warning)) return;
      await saving;
      await remove(draft);
      await render();
    };
    card.append(sync, compare, discard);
    return card;
  }

  const request = indexedDB.open(DB, 1);
  request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'id' });
  request.onsuccess = () => { db = request.result; render().catch(error => show(error.message || 'Draft view unavailable')); };
  request.onerror = () => show(request.error?.message || 'Device storage unavailable');
  window.addEventListener('online', () => { render().catch(error => show(error.message)); });
  window.addEventListener('offline', () => { render().catch(error => show(error.message)); });
})();
