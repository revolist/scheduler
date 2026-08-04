import { readFile, readdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { extname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const feature = JSON.parse(await readFile(join(root, 'feature.json'), 'utf8'));
const requiredStrings = ['slug', 'title', 'summary', 'edition', 'repositoryUrl', 'productUrl', 'trialUrl', 'demoOutput'];
const failures = [];

for (const key of requiredStrings) {
  if (typeof feature[key] !== 'string' || !feature[key]) failures.push(`feature.json: ${key} must be a non-empty string`);
}
if (!Array.isArray(feature.frameworks) || feature.frameworks.join(',') !== 'ts,react,vue,angular') {
  failures.push('feature.json: frameworks must be ts, react, vue, angular');
}
if (!Array.isArray(feature.recipes) || feature.recipes.length < 2) failures.push('feature.json: at least two recipes are required');

const media = feature.media ?? {};
const assets = [media.poster, media.walkthroughGif, media.walkthroughMp4, ...(media.screenshots ?? [])];
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

for (const relative of [media.poster, ...(media.screenshots ?? [])]) {
  const dimensions = await probeMedia(relative);
  if (dimensions.width !== 1440 || dimensions.height !== 900) {
    failures.push(`${relative}: expected 1440x900, received ${dimensions.width}x${dimensions.height}`);
  }
}
const video = await probeMedia(media.walkthroughMp4);
if (video.width !== 1440 || video.height !== 900) failures.push(`${media.walkthroughMp4}: expected 1440x900`);
if (video.duration < 20 || video.duration > 35) failures.push(`${media.walkthroughMp4}: expected 20-35 seconds, received ${video.duration}`);
const gif = await probeMedia(media.walkthroughGif);
if (gif.width !== 800 || gif.height !== 500) failures.push(`${media.walkthroughGif}: expected optimized 800x500 output`);

const readme = await readFile(join(root, 'README.md'), 'utf8');
for (const relative of assets) if (!readme.includes(relative)) failures.push(`README.md: missing media reference ${relative}`);

const forbidden = [
  '../../composables/',
  '../../demo-host.css',
  '../../../../packages/',
  'npm.pkg.github.com',
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
