import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const file = 'src/board.js';
if (!fs.existsSync(file)) {
  // eslint-disable-next-line no-console
  console.error(`missing: ${file}`);
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf8');
const looksLikePatch = content.startsWith('diff --git ')
  || content.includes('\nnew file mode ')
  || /^\s*(?:@@ .* @@|--- a\/|\+\+\+ b\/)/m.test(content)
  || /^(?:<<<<<<<|=======|>>>>>>>)/m.test(content);

if (!looksLikePatch) {
  // eslint-disable-next-line no-console
  console.log(`${file} looks valid, corruption markers not found.`);
  process.exit(0);
}

// eslint-disable-next-line no-console
console.log(`${file} looks corrupted by patch text. Restoring from git...`);
const res = spawnSync('git', ['restore', file], { stdio: 'inherit' });
if (res.status !== 0) {
  // eslint-disable-next-line no-console
  console.error('git restore failed. Try: git reset --hard origin/main (or origin/master)');
  process.exit(res.status || 1);
}

// eslint-disable-next-line no-console
console.log('Restored. Now run: corepack yarn start');