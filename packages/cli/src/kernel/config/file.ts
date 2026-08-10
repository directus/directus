import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, parse as parsePath, resolve } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { CliError } from '../error.js';
import { writeFileAtomic } from '../write.js';
import { MODES, type SyncMode } from './mode.js';

const CONFIG_FILENAME = 'directus.config.json';
const CONTROL_CHARACTER = /\p{Cc}/u;

export const INVALID_URL_MESSAGE = 'Enter a valid http(s) URL.';

/** A stored base URL must carry no secrets: no `user:pass@`, no `?token=…`. */
export function isSafeUrl(value: string): boolean {
	// URL parsing normalizes control characters away, but callers store and print the raw value.
	if (CONTROL_CHARACTER.test(value)) return false;

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

const profileSchema = z.object({
	url: z.url().refine(isSafeUrl, 'Use an http(s) URL with no credentials, query, or fragment.'),
	auth: z.object({ type: z.literal('token') }).default({ type: 'token' }),
});

// An empty list reads as "scope to nothing" but would behave as unscoped.
const scopeList = (name: string) =>
	z.array(z.string()).min(1, `"${name}" must list at least one name; remove the key to leave it unscoped.`).optional();

const projectSchema = z
	.strictObject({
		schema: z.boolean().optional(),
		collections: scopeList('collections'),
		excludeCollections: scopeList('excludeCollections'),
		resources: scopeList('resources'),
		excludeResources: scopeList('excludeResources'),
		deps: z.boolean().optional(),
		mode: z.enum(MODES).optional(),
	})
	.refine(
		(project) =>
			project.schema !== false || (project.collections === undefined && project.excludeCollections === undefined),
		{
			message:
				'"schema": false cannot be combined with "collections" or "excludeCollections" — a schema scope on a project that pulls no schema is a contradiction; remove one.',
		},
	);

// Loose so blocks written by other Directus tools survive a round trip through our writes.
const configSchema = z.looseObject({
	profiles: z.record(z.string(), profileSchema).default({}),
	directory: z.string().min(1).default('directus'),
	projects: z.record(z.string(), projectSchema).default({}),
	format: z.enum(['json']).default('json'),
});

// Written out rather than inferred, so isolated declaration emit stays possible.
interface StoredProfile {
	readonly url: string | undefined;
}

interface Profile {
	readonly url: string;
	readonly auth: { readonly type: 'token' };
}

interface ProfileWrite<T extends StoredProfile> {
	readonly profile: T;
	/** Restores the file to its state before the write. */
	readonly rollback: () => void;
}

export interface ProjectConfig {
	/** false: pull skips the snapshot; push and diff skip the schema phase. */
	readonly schema?: boolean | undefined;
	readonly collections?: readonly string[] | undefined;
	readonly excludeCollections?: readonly string[] | undefined;
	readonly resources?: readonly string[] | undefined;
	readonly excludeResources?: readonly string[] | undefined;
	readonly deps?: boolean | undefined;
	readonly mode?: SyncMode | undefined;
}

interface Config {
	readonly profiles: Readonly<Record<string, Profile>>;
	readonly directory: string;
	readonly projects: Readonly<Record<string, ProjectConfig>>;
	readonly format: 'json';
	readonly [namespace: string]: unknown;
}

export interface LoadedConfig {
	readonly path: string;
	readonly config: Config;
}

/** Walks up like git, so the CLI works from any subdirectory. */
function findConfigPath(startDir: string): string | undefined {
	const { root } = parsePath(startDir);
	let dir = startDir;

	while (true) {
		const candidate = join(dir, CONFIG_FILENAME);
		if (existsSync(candidate)) return candidate;
		if (dir === root) return undefined;
		dir = dirname(dir);
	}
}

function readJson(path: string): unknown {
	let raw: string;

	try {
		raw = readFileSync(path, 'utf8');
	} catch {
		throw new CliError('CONFIG', `Cannot read configuration file: ${path}`);
	}

	try {
		return JSON.parse(raw) as unknown;
	} catch {
		throw new CliError('CONFIG', `${path} is not valid JSON.`);
	}
}

function readConfig(path: string): LoadedConfig {
	const json = readJson(path);

	const parsed = configSchema.safeParse(json);
	if (!parsed.success)
		throw new CliError('CONFIG', `Invalid configuration in ${path}:\n${z.prettifyError(parsed.error)}`);

	return { path, config: parsed.data };
}

function readRawConfig(path: string): Record<string, unknown> {
	if (!existsSync(path)) return {};

	const parsed = readJson(path);

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

function storedProfile(value: unknown): StoredProfile {
	const url = isPlainObject(value) ? (value as Record<string, unknown>)['url'] : undefined;
	return { url: typeof url === 'string' ? url : undefined };
}

/** Every read and write of the configuration file in one CLI run. */
export interface ConfigStore {
	/** Resolved without reading the file, so env loading never depends on a parse. */
	path(): string | undefined;
	/** undefined when there is no configuration file — running without one is valid. */
	load(): LoadedConfig | undefined;
	requireConfig(): LoadedConfig;
	/**
	 * A raw read: a present result means the name is taken even when `url` is undefined, so a hand-broken
	 * entry stays repairable. Commands that use a profile rather than edit one need `requireProfile`.
	 */
	existingProfile(name: string): StoredProfile | undefined;
	requireProfile(name: string): Profile;
	upsertProfile(name: string, profile: Profile): ProfileWrite<Profile>;
	renameProfile(from: string, to: string): ProfileWrite<StoredProfile>;
	upsertProjectMode(project: string, mode: SyncMode): void;
	removeProfile(name: string): StoredProfile;
}

/** Parsing stays lazy, so profile add/remove can repair a file that fails schema validation. */
export function createConfigStore(cwd: string, configOption?: string): ConfigStore {
	let path = configOption === undefined ? findConfigPath(cwd) : resolve(cwd, configOption);
	let loaded: LoadedConfig | undefined;
	let read = false;

	function load(): LoadedConfig | undefined {
		if (!read) {
			loaded = path === undefined ? undefined : readConfig(path);
			read = true;
		}

		return loaded;
	}

	function requireConfig(): LoadedConfig {
		const config = load();

		if (config === undefined) {
			throw new CliError('CONFIG', `No ${CONFIG_FILENAME} found.`, {
				hint: 'Create one first: d6s profile add <name> --url <url>',
			});
		}

		return config;
	}

	// Invalidate the cache after a write; a new file also becomes the resolved path.
	function persisted(written: string): void {
		path = written;
		loaded = undefined;
		read = false;
	}

	return {
		path: () => path,
		load,
		requireConfig,
		existingProfile(name) {
			if (path === undefined) return undefined;

			const profiles = existingProfiles(readRawConfig(path), path);
			if (!Object.hasOwn(profiles, name)) return undefined;

			return storedProfile(profiles[name]);
		},
		requireProfile(name) {
			const { config } = requireConfig();
			const profile = Object.hasOwn(config.profiles, name) ? config.profiles[name] : undefined;

			if (profile === undefined) {
				const known = Object.keys(config.profiles);

				throw new CliError('CONFIG', `Unknown profile: "${name}"`, {
					hint:
						known.length > 0 ? `Known profiles: ${known.join(', ')}` : `No profiles are defined in ${CONFIG_FILENAME}.`,
				});
			}

			return profile;
		},
		upsertProfile(name, profile) {
			const previousPath = path;
			const target = path ?? join(cwd, CONFIG_FILENAME);
			const previousContents = existsSync(target) ? readFileSync(target, 'utf8') : undefined;
			const raw = readRawConfig(target);
			const profiles = { ...existingProfiles(raw, target), [name]: profile };
			mkdirSync(dirname(target), { recursive: true });
			writeFileAtomic(target, `${JSON.stringify({ ...raw, profiles }, null, 2)}\n`, 0o644);
			persisted(target);

			return {
				profile,
				rollback() {
					if (previousContents === undefined) {
						rmSync(target, { force: true });
					} else {
						writeFileAtomic(target, previousContents, 0o644);
					}

					path = previousPath;
					loaded = undefined;
					read = false;
				},
			};
		},
		renameProfile(from, to) {
			// Capture the path: rollback runs later, and the outer binding can move to another file.
			const target = path;

			if (target === undefined) throw new CliError('CONFIG', `No ${CONFIG_FILENAME} found.`);

			const previousContents = readFileSync(target, 'utf8');
			const raw = readRawConfig(target);
			const profiles = existingProfiles(raw, target);

			if (!Object.hasOwn(profiles, from)) throw new CliError('CONFIG', `Unknown profile: "${from}"`);

			// Renaming onto a live name would silently drop a profile.
			if (Object.hasOwn(profiles, to)) throw new CliError('CONFIG', `Profile "${to}" already exists.`);

			const profile = storedProfile(profiles[from]);

			// Rebuild in place so the renamed profile keeps its position.
			const renamed = Object.fromEntries(
				Object.entries(profiles).map(([key, value]) => [key === from ? to : key, value]),
			);

			writeFileAtomic(target, `${JSON.stringify({ ...raw, profiles: renamed }, null, 2)}\n`, 0o644);
			persisted(target);

			return {
				profile,
				rollback() {
					writeFileAtomic(target, previousContents, 0o644);
					loaded = undefined;
					read = false;
				},
			};
		},
		upsertProjectMode(project, mode) {
			const target = requireConfig().path;
			const raw = readRawConfig(target);
			const projects = isPlainObject(raw['projects']) ? (raw['projects'] as Record<string, unknown>) : {};
			const current = isPlainObject(projects[project]) ? (projects[project] as Record<string, unknown>) : {};

			writeFileAtomic(
				target,
				`${JSON.stringify({ ...raw, projects: { ...projects, [project]: { ...current, mode } } }, null, 2)}\n`,
				0o644,
			);

			persisted(target);
		},
		removeProfile(name) {
			if (path === undefined)
				throw new CliError('CONFIG', `No ${CONFIG_FILENAME} found.`, { hint: 'Nothing to remove.' });

			const raw = readRawConfig(path);
			const profiles = { ...existingProfiles(raw, path) };

			if (!Object.hasOwn(profiles, name))
				throw new CliError('CONFIG', `Unknown profile: "${name}"`, { hint: 'Nothing to remove.' });

			const profile = storedProfile(profiles[name]);
			delete profiles[name];
			writeFileAtomic(path, `${JSON.stringify({ ...raw, profiles }, null, 2)}\n`, 0o644);
			persisted(path);

			return profile;
		},
	};
}
