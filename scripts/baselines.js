#!/usr/bin/env node
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const BASELINES_DIR = path.join(ROOT, 'baselines');
const PKG = require(path.join(ROOT, 'package.json'));

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function writeJson(filename, value) {
  fs.writeFileSync(
    path.join(BASELINES_DIR, filename),
    `${JSON.stringify(value, null, 2)}\n`
  );
}

function main() {
  const css = fs.readFileSync(path.join(DIST_DIR, 'chota.css'));
  const minifiedCss = fs.readFileSync(path.join(DIST_DIR, 'chota.min.css'));
  const gzipBytes = zlib.gzipSync(minifiedCss).length;
  const metadata = {
    capturedAt: new Date().toISOString(),
    branch: git(['branch', '--show-current']),
    buildCommand: 'yarn build',
    browserslist: PKG.browserslist,
  };
  const gitSha = git(['rev-parse', 'HEAD']);

  if (gzipBytes > 4096) {
    throw new Error(`Refusing to record ${gzipBytes} gzip bytes: the 4096-byte ceiling is exceeded.`);
  }

  writeJson('size-baseline.json', {
    ...metadata,
    source: 'src/chota.css',
    dist_chota_css_bytes: css.length,
    dist_chota_min_css_bytes: minifiedCss.length,
    gzip_bytes: gzipBytes,
    gzip_ceiling_bytes: 4096,
    gzip_budget_remaining_bytes: 4096 - gzipBytes,
  });

  writeJson('sizes.json', {
    ...metadata,
    css: {
      chotaCssBytes: css.length,
      chotaMinCssBytes: minifiedCss.length,
      chotaMinCssGzipBytes: gzipBytes,
    },
    gzipCeilingBytes: 4096,
    gzipBudgetRemainingBytes: 4096 - gzipBytes,
  });

  writeJson('browser-support.json', {
    ...metadata,
    supported: [
      'Chrome (last 2 versions)',
      'Firefox (last 2 versions)',
      'Edge (last 2 versions)',
      'Safari 15.4 and later',
      'iOS Safari 15.4 and later',
    ],
    dropped: ['Internet Explorer', 'Opera'],
  });

  console.log(`Recorded ${gzipBytes} gzip bytes for ${metadata.branch}@${gitSha}.`);
}

main();
