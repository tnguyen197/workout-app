export const dynamic = 'force-dynamic';

// Unauthenticated: tells the client whether to show the backup section at
// all. Reveals only whether the feature is switched on, never any data.
export async function GET() {
  const hasStore = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  );
  return Response.json({
    configured: hasStore && Boolean(process.env.BACKUP_SECRET),
    hasStore,
    hasSecret: Boolean(process.env.BACKUP_SECRET),
  });
}
