import { execSync } from 'child_process';
import { readFileSync } from 'fs';

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

// Build label shown at the bottom of the app, e.g. "v1.14 · 2026.07.28".
//
// The number is the commit count, so it rises on its own with every push
// and a higher number always means newer. Vercel shallow-clones by default,
// which would make that count wrong rather than merely missing, so the
// repository is checked for shallowness first and the version from
// package.json is used instead when the history is truncated.
function buildLabel() {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  const major = pkg.version.split('.')[0];

  const shallow = git('rev-parse --is-shallow-repository');
  const count = shallow === 'false' ? git('rev-list --count HEAD') : null;

  // package.json's version is bumped on every push, so the label still
  // rises when the count is unavailable.
  const version = count ? `v${major}.${count}` : `v${pkg.version}`;
  const now = new Date();

  return {
    version,
    date: now.toISOString().slice(0, 10).replace(/-/g, '.'),
    stamp: `${version} built ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    sha: (process.env.VERCEL_GIT_COMMIT_SHA || git('rev-parse HEAD') || '')
      .slice(0, 7),
  };
}

const build = buildLabel();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_VERSION: build.version,
    NEXT_PUBLIC_BUILT_AT: build.date,
    NEXT_PUBLIC_SHA: build.sha,
    NEXT_PUBLIC_STAMP: build.stamp,
  },
};

export default nextConfig;
