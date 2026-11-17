#!/usr/bin/env node
'use strict';

/**
 * Container entrypoint for both runtime images.
 *
 * It boots in two steps:
 *
 *   1. `directus bootstrap` - idempotent DB install/migrate + ensure admin.
 *   2. Hand off to pm2-runtime as the long-lived process supervisor.
 *
 * Doing this in Node rather than a shell command is what lets the hardened
 * (distroless) image, which ships no shell, run the same boot as the regular
 * one.
 *
 * pm2 comes from @directus/api's own dependencies rather than a separate copy
 * installed into the image, so it is subject to the workspace's
 * `pnpm.overrides`. It gets resolved rather than hardcoded because its only
 * literal path in the deployed bundle contains the pm2 version.
 */

const { spawnSync, spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const { realpathSync } = require('node:fs');

const node = process.execPath;

const api = realpathSync(require.resolve('./node_modules/@directus/api/package.json'));
const pm2Runtime = createRequire(api).resolve('pm2/bin/pm2-runtime');

const bootstrap = spawnSync(node, ['cli.js', 'bootstrap'], { stdio: 'inherit' });

if (bootstrap.status !== 0) {
	process.exit(bootstrap.status ?? 1);
}

const pm2 = spawn(node, [pm2Runtime, 'start', 'ecosystem.config.cjs'], { stdio: 'inherit' });

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT']) {
	process.on(signal, () => pm2.kill(signal));
}

pm2.on('exit', (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
	} else {
		process.exit(code ?? 0);
	}
});

pm2.on('error', (err) => {
	console.error('Failed to start pm2-runtime:', err);
	process.exit(1);
});
