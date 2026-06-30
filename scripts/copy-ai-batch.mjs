/** Usage: node scripts/copy-ai-batch.mjs id1:25 id2:26 ... */
import { copyFileSync } from 'node:fs';
import path from 'node:path';

const IMGDIR = '/home/usow/.grok/sessions/%2Fhome%2Fusow/019f190e-110a-7be0-a2ff-d3ba9ba4bd09/images';
const POST = path.resolve('public/assets/posters');

for (const pair of process.argv.slice(2)) {
  const [id, num] = pair.split(':');
  copyFileSync(path.join(IMGDIR, `${num}.jpg`), path.join(POST, `${id}.jpg`));
  console.log(`copied ${id}.jpg`);
}