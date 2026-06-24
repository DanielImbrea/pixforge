#!/usr/bin/env node
/**
 * Regenerates landing demo "after" image from the same source photo.
 * Requires: python3, rembg, pillow, scipy, onnxruntime
 *
 * Usage: node scripts/generate-demo-bg-removal.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'generate-demo-bg-removal.py');
const result = spawnSync('python3', [script], { stdio: 'inherit' });

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
