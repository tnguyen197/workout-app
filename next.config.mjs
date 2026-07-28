import { execSync } from 'child_process';

// Bake a build identifier into the client bundle so the badge in the topbar
// always reflects exactly what is deployed.
//
// Vercel sets VERCEL_GIT_COMMIT_SHA during every build, which is the
// authoritative source. The git fallback only covers running locally; a
// shell-out cannot be relied on in a build container.
function buildId() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'local';
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BUILD: buildId(),
    NEXT_PUBLIC_BUILT_AT: new Date().toISOString().slice(0, 10),
  },
};

export default nextConfig;
