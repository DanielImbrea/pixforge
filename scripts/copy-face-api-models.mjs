import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules/@vladmandic/face-api/model');
const targets = [
  path.join(root, 'lib/vendor/face-api-model'),
  path.join(root, 'public/face-api-models'),
];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(src)) {
  console.warn('[copy-face-api-models] source not found, skipping:', src);
  process.exit(0);
}

for (const dest of targets) {
  copyDir(src, dest);
  console.log('[copy-face-api-models] copied models to', dest);
}
