import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, parse as parsePath } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { CliError } from '../error.js';
import { writeFileAtomic } from '../write.js';

const CONFIG_FILENAME = 'directus.config.json';

// A committable base URL must carry no secrets: http(s) only, no userinfo and no
// query/fragment — so `https://user:pass@host` or `?token=…` can never be written
// to config or printed by `profile list`. Also serves as the prompt validator.
export function isSafeUrl(value: string): boolean {
	let parsed: URL;

	try {
		parsed = new URL(value);
	} catch {
		return false;
	}

	return (
		(parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
		parsed.username === '' &&
		parsed.password === '' &&
		parsed.search === '' &&
		parsed.hash === ''
	);
}

// No secrets ever live here — this file is committable. Credentials resolve
// separately (env / ~/.directus/credentials.json / prompt).
const profileSchema = z.object({
	url: z.url().refine(isSafeUrl, 'Use an http(s) URL with no credentials, query, or fragment.'),
	auth: z.object({ type: z.literal('token') }).default({ type: 'token' }),
});

// The kernel owns `profiles`; any other top-level key (e.g. a future
// `sync` block) passes through untouched for its own consumer to read.
const configSchema = z.looseObject({
	profiles: z.record(z.string(), profileSchema).default({}),
});

// Explicit types keep isolated declaration emit independent of schema inference.
interface Profile {
	readonly url: string;
	readonly auth: { readonly type: 'token' };
}

interface Config {
	readonly profiles: Readonly<Record<string, Profile>>;
	readonly [namespace: string]: unknown;
}

interface LoadedConfig {
	readonly path: string;
	readonly config: Config;
}

interface ConfigLocation {
	readonly cwd: string;
	readonly configPath?: string | undefined;
}

// Walk up from the starting dir like git, so the CLI works from any subdirectory.
// undefined means nothing was found — profile-less operation stays first-class.
export function findConfigPath(startDir: string): string | undefined {
	const { root } = parsePath(startDir);
	let dir = startDir;

	for (;;) {
		const candidate = join(dir, CONFIG_FILENAME);
		if (existsSync(candidate)) return candidate;
		if (dir === root) return undefined;
		dir = dirname(dir);
	}
}

// An explicit `--config` path wins, otherwise walk-up discovery. A missing
// discovered file is not an error (profile-less); a missing explicit path or a
// malformed file is.
export function loadConfig(location: ConfigLocation): LoadedConfig | undefined {
	const path = location.configPath ?? findConfigPath(location.cwd);
	if (path === undefined) return undefined;

	let raw: string;

	try {
		raw = readFileSync(path, 'utf8');
	} catch {
		throw new CliError('CONFIG', `Cannot read config file: ${path}`);
	}

	let json: unknown;

	try {
		json = JSON.parse(raw);
	} catch {
		throw new CliError('CONFIG', `${path} is not valid JSON.`);
	}

	const parsed = configSchema.safeParse(json);
	if (!parsed.success) throw new CliError('CONFIG', `Invalid config in ${path}:\n${z.prettifyError(parsed.error)}`);

	return { path, config: parsed.data };
}

// Preserve top-level namespaces the CLI does not own.
function readRawConfig(path: string): Record<string, unknown> {
	if (!existsSync(path)) return {};

	let parsed: unknown;

	try {
		parsed = JSON.parse(readFileSync(path, 'utf8'));
	} catch {
		throw new CliError('CONFIG', `${path} is not valid JSON.`);
	}

	if (!isPlainObject(parsed)) {
		throw new CliError('CONFIG', `${path} is not a JSON object.`, { hint: 'Fix or remove the file.' });
	}

	return parsed as Record<string, unknown>;
}

function existingProfiles(raw: Record<string, unknown>, path: string): Record<string, unknown> {
	const profiles = raw['profiles'];
	if (profiles === undefined) return {};

	if (!isPlainObject(profiles)) {
		throw new CliError('CONFIG', `"profiles" in ${path} is not an object.`, { hint: 'Fix or remove it.' });
	}

	return profiles as Record<string, unknown>;
}

// Upsert into the explicit or discovered config, or a new file at cwd.
export function upsertProfile(location: ConfigLocation, name: string, profile: Profile): void {
	const path = location.configPath ?? findConfigPath(location.cwd) ?? join(location.cwd, CONFIG_FILENAME);
	const raw = readRawConfig(path);
	const profiles = { ...existingProfiles(raw, path), [name]: profile };
	mkdirSync(dirname(path), { recursive: true });
	writeFileAtomic(path, `${JSON.stringify({ ...raw, profiles }, null, 2)}\n`, 0o644);
}

export function removeProfile(location: ConfigLocation, name: string): string | undefined {
	const path = location.configPath ?? findConfigPath(location.cwd);
	if (path === undefined)
		throw new CliError('CONFIG', 'No directus.config.json found.', { hint: 'Nothing to remove.' });

	const raw = readRawConfig(path);
	const profiles = { ...existingProfiles(raw, path) };

	if (!Object.hasOwn(profiles, name))
		throw new CliError('CONFIG', `Unknown profile: "${name}"`, { hint: 'Nothing to remove.' });

	const removed = profiles[name];
	delete profiles[name];
	writeFileAtomic(path, `${JSON.stringify({ ...raw, profiles }, null, 2)}\n`, 0o644);

	return isPlainObject(removed) && typeof (removed as Record<string, unknown>)['url'] === 'string'
		? ((removed as Record<string, unknown>)['url'] as string)
		: undefined;
}

// A miss names the known profiles so a typo is fixable without opening the file.
export function resolveProfile(config: Config, name: string): Profile {
	const profile = Object.hasOwn(config.profiles, name) ? config.profiles[name] : undefined;

	if (profile === undefined) {
		const known = Object.keys(config.profiles);

		throw new CliError('CONFIG', `Unknown profile: "${name}"`, {
			hint:
				known.length > 0 ? `Known profiles: ${known.join(', ')}` : 'No profiles are defined in directus.config.json.',
		});
	}

	return profile;
}
