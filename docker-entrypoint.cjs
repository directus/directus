#!/usr/bin/env node
'use strict';

/**
 * Container entrypoint for the hardened (distroless) runtime image.
 *
 * The hardened base image ships no shell, so the previous shell-form CMD
 * (`node cli.js bootstrap && pm2-runtime start ecosystem.config.cjs`) can no
 * longer run. This launcher reproduces that two-step boot in pure Node:
 *
 *   1. `directus bootstrap` - idempotent DB install/migrate + ensure admin.
 *   2. Hand off to pm2-runtime as the long-lived process supervisor.
 *
 * pm2 is copied into /directus/pm2 from the build stage (see Dockerfile), so we
 * invoke its bin directly rather than relying on a global shim on PATH.
 */

const { spawnSync, spawn } = require('node:child_process');

const node = process.execPath;

const bootstrap = spawnSync(node, ['cli.js', 'bootstrap'], { stdio: 'inherit' });

if (bootstrap.status !== 0) {
	process.exit(bootstrap.status ?? 1);
}

const pm2 = spawn(node, ['pm2/bin/pm2-runtime', 'start', 'ecosystem.config.cjs'], { stdio: 'inherit' });

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
