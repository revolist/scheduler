import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { chromium } from 'playwright';

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const feature = JSON.parse(await readFile(join(root, 'feature.json'), 'utf8'));
const inspect = process.argv.includes('--inspect');
const host = '127.0.0.1';
const port = 4317;
const viewport = { width: 1440, height: 900 };
const temporaryRoot = await mkdtemp(join(tmpdir(), `${feature.slug}-media-`));

const stories = {
  pivot: [
    ['Switch complete financial models with one preset', async (page) => clickIfPresent(page.getByRole('button', { name: 'Profitability', exact: true }))],
    ['Drill into generated year and dimension hierarchies', async (page) => clickIfPresent(page.getByLabel('Expand 2024'))],
    ['Open the analytical workspace for presentation-ready reporting', async (page) => clickIfPresent(page.getByRole('button', { name: 'Expand workspace' }))],
  ],
  gantt: [
    ['Compare the active plan with its approved baseline', async (page) => clickIfPresent(page.getByText('Baselines', { exact: true }))],
    ['Focus the task table and timeline around the planning task', async (page) => dragResize(page)],
    ['Reveal the work that controls the project finish', async (page) => clickIfPresent(page.getByText('Critical path', { exact: true }))],
  ],
  kanban: [
    ['Move work across stages with synchronized ordering', async (page) => dragCard(page)],
    ['Keep busy boards focused with collapsible swimlanes', async (page) => clickIfPresent(page.getByLabel('Collapse swimlane: Platform team'))],
    ['Inspect the delivery detail attached to each card', async (page) => clickIfPresent(page.locator('article[aria-label]').first())],
  ],
  scheduler: [
    ['Move from calendar time to resource capacity', async (page) => clickIfPresent(page.getByRole('button', { name: 'Resource', exact: true }))],
    ['Use the synchronized table for operational detail', async (page) => clickIfPresent(page.getByRole('button', { name: 'Table', exact: true }))],
    ['Return to a month-level planning view', async (page) => {
      await clickIfPresent(page.getByRole('button', { name: 'Calendar', exact: true }));
      await clickIfPresent(page.getByRole('button', { name: 'Month', exact: true }));
    }],
  ],
};

async function clickIfPresent(locator) {
  if (await locator.count()) {
    await locator.first().click();
    await new Promise((resolveWait) => setTimeout(resolveWait, 900));
  }
}

async function dragCard(page) {
  const source = page.locator('article[aria-label^="Customer interview synthesis"]').first();
  const target = page.locator('[aria-label="In progress, Product team"]').first();
  if (await source.count() && await target.count()) {
    await source.dragTo(target);
    await page.waitForTimeout(1_100);
  }
}

async function dragResize(page) {
  const resize = page.getByLabel('Resize gantt panel').first();
  if (!await resize.count()) return;
  const box = await resize.boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 110, box.y + box.height / 2, { steps: 18 });
  await page.mouse.up();
  await page.waitForTimeout(900);
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://${host}:${port}`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error('Timed out waiting for Vite preview');
}

async function addPresentation(page) {
  await page.addStyleTag({ content: `
    #rv-media-brand, #rv-media-caption { pointer-events: none; position: fixed; z-index: 2147483646; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    #rv-media-brand { top: 24px; left: 50%; transform: translateX(-50%); padding: 12px 18px; border-radius: 14px; background: rgba(255,255,255,.94); color: #111827; box-shadow: 0 18px 50px rgba(15,23,42,.18); font-weight: 750; }
    #rv-media-caption { left: 50%; bottom: 28px; transform: translateX(-50%); max-width: 760px; padding: 11px 18px; border-radius: 999px; background: rgba(15,23,42,.9); color: white; box-shadow: 0 14px 40px rgba(15,23,42,.24); font-weight: 650; text-align: center; }
  ` });
  await page.evaluate(({ title, summary }) => {
    const brand = document.createElement('div');
    brand.id = 'rv-media-brand';
    brand.textContent = `${title} · RevoGrid`;
    brand.title = summary;
    const caption = document.createElement('div');
    caption.id = 'rv-media-caption';
    document.body.append(brand, caption);
  }, feature);
}

async function setCaption(page, caption) {
  await page.evaluate((value) => {
    const element = document.querySelector('#rv-media-caption');
    if (element) element.textContent = value;
  }, caption);
  await page.waitForTimeout(800);
}

async function capture(page, name) {
  const png = join(temporaryRoot, `${name}.png`);
  const target = join(root, 'assets/screenshots', `${name}.webp`);
  await page.screenshot({ path: png });
  await execFileAsync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '76', target]);
}

async function encodeVideo(rawVideo) {
  const mp4 = join(root, 'assets', `${feature.slug}-walkthrough.mp4`);
  const gif = join(root, 'assets', `${feature.slug}-walkthrough.gif`);
  const poster = join(root, 'assets', `${feature.slug}-walkthrough-poster.webp`);
  await execFileAsync('ffmpeg', ['-loglevel', 'error', '-y', '-i', rawVideo, '-vf', 'tpad=stop_mode=clone:stop_duration=20,fps=30,scale=1440:900:flags=lanczos,format=yuv420p', '-t', '22', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', mp4]);
  await execFileAsync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp4, '-filter_complex', 'fps=7,scale=800:-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle', '-loop', '0', gif]);
  await execFileAsync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', '1.2', '-i', mp4, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '78', poster]);
}

async function createContactSheet() {
  const output = join(tmpdir(), `${feature.slug}-media-review.jpg`);
  await execFileAsync('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(root, 'assets/screenshots/overview.webp'), '-i', join(root, 'assets/screenshots/workflow.webp'), '-i', join(root, 'assets/screenshots/details.webp'), '-i', join(root, 'assets/screenshots/result.webp'), '-filter_complex', '[0:v][1:v]hstack[top];[2:v][3:v]hstack[bottom];[top][bottom]vstack,scale=1440:-2', output]);
  console.log(`Review contact sheet: ${output}`);
}

await access(join(root, 'dist/index.html'));
const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--host', host, '--port', String(port)], { cwd: root, stdio: 'ignore' });
await waitForPreview();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport,
  colorScheme: 'light',
  locale: 'en-US',
  timezoneId: 'UTC',
  ...(inspect ? {} : { recordVideo: { dir: temporaryRoot, size: viewport } }),
});
const page = await context.newPage();
const video = page.video();
const browserErrors = [];
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
page.on('pageerror', (error) => browserErrors.push(error.message));

try {
  await page.goto(`http://${host}:${port}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1_500);
  await addPresentation(page);
  await setCaption(page, feature.summary);
  await capture(page, 'overview');
  const names = ['workflow', 'details', 'result'];
  for (const [index, [caption, action]] of stories[feature.slug].entries()) {
    await setCaption(page, caption);
    await action(page);
    await capture(page, names[index]);
  }
  if (browserErrors.length) throw new Error(`Browser errors:\n${browserErrors.join('\n')}`);
} finally {
  await context.close();
  await browser.close();
  preview.kill('SIGTERM');
}

if (!inspect && video) await encodeVideo(await video.path());
await createContactSheet();
await rm(temporaryRoot, { recursive: true, force: true });
