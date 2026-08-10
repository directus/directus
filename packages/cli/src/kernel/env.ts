import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

/** Gates credential resolution: pipelines authenticate from the environment, never the saved store. */
export function isCI(): boolean {
	return Boolean(process.env['CI']);
}

/** For unattended TTYs, where a per-command flag cannot be threaded. Presence is the signal, like NO_COLOR. */
export function promptsDisabled(): boolean {
	return Boolean(process.env['NO_INTERACTIVE']);
}

/** Never clobbers a value already set, so the real (or CI) environment stays authoritative. */
export function loadProjectEnv(dir: string): void {
	const path = join(dir, '.env');
	if (!existsSync(path)) return;

	const parsed = parseEnv(readFileSync(path, 'utf8'));

	for (const [key, value] of Object.entries(parsed)) {
		if (process.env[key] === undefined) process.env[key] = value;
	}
}
