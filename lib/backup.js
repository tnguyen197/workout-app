const KEY_STORE = 'gym-log-backup-key';

export function savedKey() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(KEY_STORE) || '';
  } catch {
    return '';
  }
}

export function rememberKey(key) {
  try {
    if (key) window.localStorage.setItem(KEY_STORE, key);
    else window.localStorage.removeItem(KEY_STORE);
  } catch {
    // Storage unavailable; the key just won't survive a reload.
  }
}

export async function fetchStatus() {
  try {
    const res = await fetch('/api/backup/status', { cache: 'no-store' });
    if (!res.ok) return { configured: false, hasStore: false, hasSecret: false };
    return await res.json();
  } catch {
    return { configured: false, hasStore: false, hasSecret: false };
  }
}

export async function pushBackup(key, state) {
  const res = await fetch('/api/backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-backup-key': key },
    body: JSON.stringify(state),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${body.error || 'Backup failed.'} (${res.status})`);
  return body.updatedAt;
}

/** Reports what is stored without returning or replacing anything. */
export async function inspectBackup(key) {
  const res = await fetch('/api/backup?meta=1', {
    headers: { 'x-backup-key': key },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 404) return { exists: false };
  if (!res.ok) {
    throw new Error(
      `${body.error || 'Could not check the backup.'} (${res.status})`
    );
  }
  return body;
}

export async function pullBackup(key) {
  const res = await fetch('/api/backup', {
    headers: { 'x-backup-key': key },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(
      `${body.error || 'Could not fetch the backup.'} (${res.status})`
    );
  }
  if (!body?.data?.exercises) {
    throw new Error('The stored backup came back in an unexpected shape.');
  }
  return body;
}
