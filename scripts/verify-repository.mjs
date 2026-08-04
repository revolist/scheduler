import { readFile, readdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { extname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const feature = JSON.parse(await readFile(join(root, 'feature.json'), 'utf8'));
const requiredStrings = ['slug', 'title', 'summary', 'edition', 'repositoryUrl', 'productUrl', 'trialUrl', 'demoOutput'];
const failures = [];

for (const requiredFile of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
  try {
    await stat(join(root, requiredFile));
  } catch {
    failures.push(`${requiredFile}: required standalone repository file is missing`);
  }
}
const workspace = await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8');
if (!/^packages:\s*\n\s*- ["']?\.["']?\s*$/m.test(workspace)) {
  failures.push('pnpm-workspace.yaml: repository root must be its own workspace');
}

const npmrc = await readFile(join(root, '.npmrc'), 'utf8');
for (const requiredRegistryLine of [
  '@revolist:registry=https://npm.pkg.github.com',
  '//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}',
]) {
  if (!npmrc.split(/\r?\n/).includes(requiredRegistryLine)) {
    failures.push(`.npmrc: missing required GitHub Packages configuration ${requiredRegistryLine}`);
  }
}

const lockfile = await readFile(join(root, 'pnpm-lock.yaml'), 'utf8');
const revolistResolutions = [...lockfile.matchAll(/^  '(@revolist\/[^']+)':\n    resolution: \{([^}]*)\}/gm)];
if (!revolistResolutions.length) failures.push('pnpm-lock.yaml: no @revolist package resolutions found');
for (const [, packageName, resolution] of revolistResolutions) {
  if (!resolution.includes('tarball: https://npm.pkg.github.com/download/')) {
    failures.push(`pnpm-lock.yaml: ${packageName} is missing its GitHub download URL`);
  }
}

for (const key of requiredStrings) {
  if (typeof feature[key] !== 'string' || !feature[key]) failures.push(`feature.json: ${key} must be a non-empty string`);
}
if (!Array.isArray(feature.frameworks) || feature.frameworks.join(',') !== 'ts,react,vue,angular') {
  failures.push('feature.json: frameworks must be ts, react, vue, angular');
}
if (!Array.isArray(feature.recipes) || feature.recipes.length < 2) failures.push('feature.json: at least two recipes are required');

const verifyMedia = process.argv.includes('--media');
const media = feature.media ?? {};
const assets = verifyMedia ? [media.poster, media.walkthroughGif, media.walkthroughMp4, ...(media.screenshots ?? [])] : [];
for (const relative of assets) {
  if (!relative) {
    failures.push('feature.json: media paths must be complete');
    continue;
  }
  try {
    const info = await stat(join(root, relative));
    const limit = relative.endsWith('.mp4') || relative.endsWith('.gif') ? 5_000_000 : 500_000;
    if (info.size > limit) failures.push(`${relative}: ${info.size} bytes exceeds ${limit}`);
  } catch {
    failures.push(`${relative}: file is missing`);
  }
}

async function probeMedia(relative) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height:format=duration',
    '-of', 'json', join(root, relative),
  ]);
  const result = JSON.parse(stdout);
  return {
    width: result.streams?.[0]?.width,
    height: result.streams?.[0]?.height,
    duration: Number(result.format?.duration),
  };
}

for (const relative of verifyMedia ? [media.poster, ...(media.screenshots ?? [])] : []) {
  const dimensions = await probeMedia(relative);
  if (dimensions.width !== 1440 || dimensions.height !== 900) {
    failures.push(`${relative}: expected 1440x900, received ${dimensions.width}x${dimensions.height}`);
  }
}
if (verifyMedia) {
  const video = await probeMedia(media.walkthroughMp4);
  if (video.width !== 1440 || video.height !== 900) failures.push(`${media.walkthroughMp4}: expected 1440x900`);
  if (video.duration < 20 || video.duration > 35) failures.push(`${media.walkthroughMp4}: expected 20-35 seconds, received ${video.duration}`);
  const gif = await probeMedia(media.walkthroughGif);
  if (gif.width !== 800 || gif.height !== 500) failures.push(`${media.walkthroughGif}: expected optimized 800x500 output`);
}

const readme = await readFile(join(root, 'README.md'), 'utf8');
for (const relative of verifyMedia ? [media.walkthroughGif, media.walkthroughMp4] : []) {
  if (!readme.includes(relative)) failures.push(`README.md: missing media reference ${relative}`);
}

const forbidden = [
  '../../composables/',
  '../../demo-host.css',
  '../../../../packages/',
  'trial.rv-grid.com',
  '"latest"',
];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', '.artifacts'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (['.ts', '.tsx', '.vue', '.json', '.md', '.yml', '.yaml'].includes(extname(entry.name)) || entry.name === 'package.json') {
      const source = await readFile(path, 'utf8');
      for (const value of forbidden) if (source.includes(value)) failures.push(`${path.slice(root.length + 1)}: contains forbidden coupling ${value}`);
    }
  }
}
await walk(root);

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log(`${feature.title}: repository contract verified`);
