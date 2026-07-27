import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const KEY = 'gym-log:backup';

// The Marketplace integration injects UPSTASH_* names; stores migrated from
// the old Vercel KV product carry KV_* names. Accept either.
function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Length-independent comparison, so a wrong passphrase leaks no timing. */
function sameSecret(given) {
  const want = process.env.BACKUP_SECRET;
  if (!want || !given) return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(want);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

function guard(request) {
  const db = redis();
  if (!db) {
    return {
      error: Response.json(
        { error: 'Backup storage is not configured on the server.' },
        { status: 501 }
      ),
    };
  }
  if (!sameSecret(request.headers.get('x-backup-key'))) {
    return {
      error: Response.json({ error: 'Wrong passphrase.' }, { status: 401 }),
    };
  }
  return { db };
}

export async function GET(request) {
  const { db, error } = guard(request);
  if (error) return error;

  try {
    const saved = await db.get(KEY);
    if (!saved) return Response.json({ error: 'No backup yet.' }, { status: 404 });
    return Response.json(saved);
  } catch {
    return Response.json({ error: 'Could not read the backup.' }, { status: 502 });
  }
}

export async function POST(request) {
  const { db, error } = guard(request);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body was not valid JSON.' }, { status: 400 });
  }
  if (!body?.exercises || !body?.days) {
    return Response.json(
      { error: "That doesn't look like Gym Log data." },
      { status: 400 }
    );
  }

  const updatedAt = new Date().toISOString();
  try {
    await db.set(KEY, { updatedAt, data: body });
    return Response.json({ updatedAt });
  } catch {
    return Response.json({ error: 'Could not save the backup.' }, { status: 502 });
  }
}
