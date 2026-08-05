import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

/**
 * True in CI so credential resolution skips the interactive store and prompt —
 * pipelines authenticate from the environment only.
 */
export function isCI(): boolean {
	return Boolean(process.env['CI']);
}

/**
 * Disable prompts for unattended TTYs where a per-command flag cannot be threaded. Presence, like
 * `NO_COLOR`, is the signal.
 */
export function promptsDisabled(): boolean {
	return Boolean(process.env['NO_INTERACTIVE']);
}

/**
 * Load a project-root `.env` into process.env without clobbering values already
 * set, so the real / CI environment stays authoritative. Uses the stdlib parser
 * (no dotenv dependency); a missing file is a no-op.
 */
export function loadProjectEnv(dir: string): void {
	const path = join(dir, '.env');
	if (!existsSync(path)) return;

	const parsed = parseEnv(readFileSync(path, 'utf8'));

	for (const [key, value] of Object.entries(parsed)) {
		if (process.env[key] === undefined) process.env[key] = value;
	}
}
