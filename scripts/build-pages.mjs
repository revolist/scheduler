import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'pages-dist');
const feature = JSON.parse(await readFile(join(root, 'feature.json'), 'utf8'));
const demoUrl = new URL(feature.liveDemoUrl);

await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'demo'), { recursive: true });
await cp(join(root, feature.demoOutput), join(output, 'demo'), { recursive: true });

await writeFile(join(output, 'CNAME'), `${demoUrl.hostname}\n`);
await writeFile(join(output, 'index.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="0; url=./demo/" />
    <link rel="canonical" href="${feature.liveDemoUrl}" />
    <title>${feature.title}</title>
  </head>
  <body>
    <p><a href="./demo/">Open the ${feature.title} demo</a></p>
  </body>
</html>
`);

console.log(`GitHub Pages artifact assembled at ${output}`);
