#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BASELINE_FILE = path.join(__dirname, '..', 'baselines', 'size-baseline.json');
const DIST_FILE = path.join(__dirname, '..', 'dist', 'chota.min.css');
const CEILING_KEY = 'gzip_ceiling_bytes';
const GZIP_KEY = 'gzip_bytes';

// Read baseline
let baseline;
try {
  const data = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
  baseline = data;
} catch (e) {
  console.error('Error: Could not read size baseline. Run Week 1 baselines first.');
  process.exit(2);
}

const ceiling = baseline[CEILING_KEY];
const recordedBaseline = baseline[GZIP_KEY];

if (!ceiling || !recordedBaseline) {
  console.error('Error: Baseline missing gzip_ceiling_bytes or gzip_bytes.');
  process.exit(2);
}

// Measure current gzip size using zlib (portable, no shell)
let currentGzip;
try {
  const fileBuffer = fs.readFileSync(DIST_FILE);
  currentGzip = zlib.gzipSync(fileBuffer).length;
} catch (e) {
  console.error(`Error: Could not measure ${DIST_FILE}. Run 'yarn build' first.`);
  process.exit(2);
}

console.log(`Size gate: ${currentGzip} bytes (baseline: ${recordedBaseline}, ceiling: ${ceiling})`);

if (currentGzip > ceiling) {
  const over = currentGzip - ceiling;
  console.error(
    `FAIL: Size exceeds ${ceiling} byte ceiling by ${over} bytes. ` +
    `Baseline: ${recordedBaseline} bytes. ` +
    `Provide a written rationale in PR description to approve an increase.`
  );
  process.exit(1);
}

if (currentGzip > recordedBaseline) {
  const over = currentGzip - recordedBaseline;
  console.error(
    `FAIL: Size exceeds recorded baseline by ${over} bytes ` +
    `(baseline: ${recordedBaseline}, ceiling: ${ceiling}). ` +
    `Baseline increases require a written rationale and owner approval.`
  );
  process.exit(1);
}

console.log(`PASS: Within baseline and ceiling.`);
process.exit(0);
