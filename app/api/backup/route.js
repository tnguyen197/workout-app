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

/**
 * Upstash normally parses JSON on the way out, but depending on how the
 * store was provisioned it can hand back the raw string instead. Accept
 * either rather than trusting one shape.
 */
function normalise(raw) {
  if (raw == null) return null;
  let value = raw;
  for (let i = 0; i < 2 && typeof value === 'string'; i++) {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value && typeof value === 'object' ? value : null;
}

export async function GET(request) {
  const { db, error } = guard(request);
  if (error) return error;

  let raw;
  try {
    raw = await db.get(KEY);
  } catch (e) {
    return Response.json(
      { error: `Could not reach the backup store. ${e?.message ?? ''}`.trim() },
      { status: 502 }
    );
  }

  if (raw == null) {
    return Response.json({ error: 'No backup stored yet.' }, { status: 404 });
  }

  const saved = normalise(raw);
  if (!saved?.data?.exercises || !saved?.data?.days) {
    return Response.json(
      {
        error: 'A backup exists but could not be read.',
        storedType: typeof raw,
        topLevelKeys: saved ? Object.keys(saved).slice(0, 8) : null,
      },
      { status: 500 }
    );
  }

  // ?meta=1 reports what is stored without handing back the payload, so
  // you can check the store is healthy without overwriting the device.
  if (new URL(request.url).searchParams.get('meta') === '1') {
    return Response.json({
      exists: true,
      updatedAt: saved.updatedAt ?? null,
      exercises: Object.keys(saved.data.exercises).length,
      days: saved.data.days.length,
      sessions: saved.data.sessions?.length ?? 0,
      bytes: JSON.stringify(saved.data).length,
    });
  }

  return Response.json(saved);
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
    // Stringify explicitly so what goes in has one known shape, rather
    // than depending on the client's automatic serialisation.
    await db.set(KEY, JSON.stringify({ updatedAt, data: body }));
    return Response.json({ updatedAt });
  } catch (e) {
    return Response.json(
      { error: `Could not save the backup. ${e?.message ?? ''}`.trim() },
      { status: 502 }
    );
  }
}
