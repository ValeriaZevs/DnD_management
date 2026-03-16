import fs from 'node:fs';
import path from 'node:path';

const targets = [
  '.yarn/cache',
  '.yarn/unplugged',
  '.pnp.cjs',
  '.pnp.loader.mjs',
  'node_modules',
];

for (const target of targets) {
  const fullPath = path.resolve(process.cwd(), target);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    // eslint-disable-next-line no-console
    console.log(`removed: ${target}`);
  }
}

// eslint-disable-next-line no-console
console.log('\nDone. Next steps:');
// eslint-disable-next-line no-console
console.log('1) corepack prepare yarn@4.12.0 --activate');
// eslint-disable-next-line no-console
console.log('2) corepack yarn install');
// eslint-disable-next-line no-console
console.log('3) corepack yarn start');
