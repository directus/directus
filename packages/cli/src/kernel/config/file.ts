import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, parse as parsePath, resolve } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { CliError } from '../error.js';
import { writeFileAtomic } from '../write.js';
import { MODES, type SyncMode } from './mode.js';

const CONFIG_FILENAME = 'directus.config.json';
const CONTROL_CHARACTER = /\p{Cc}/u;

/** The single rejection message for every `isSafeUrl` failure, in prompts and usage errors alike. */
export const INVALID_URL_MESSAGE = 'Enter a valid http(s) URL.';

/**
 * A stored base URL must carry no secrets: http(s) only, no userinfo and no
 * query/fragment — so `https://user:pass@host` or `?token=…` can never be written
 * to configuration or printed by `profile list`. Also serves as the prompt validator.
 */
export function isSafeUrl(value: string): boolean {
	// URL parsing normalizes controls, but callers store and print the raw value.
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

// Reject scope mistakes that could silently widen a mirror pull and its delete authority.
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

// Preserve top-level namespaces owned by other consumers — a `"templates"` or `"extensions"` block written
// by another Directus tool has to survive a round trip through any profile or project write we make here.
const configSchema = z.looseObject({
	profiles: z.record(z.string(), profileSchema).default({}),
	directory: z.string().min(1).default('directus'),
	projects: z.record(z.string(), projectSchema).default({}),
	format: z.enum(['json']).default('json'),
});

// Explicit types keep isolated declaration emit independent of schema inference.
interface Profile {
	readonly url: string;
	readonly auth: { readonly type: 'token' };
}

/** Optional project-level sync scope and mode defaults. */
export interface ProjectConfig {
	/** false: this project owns no schema — pull skips the snapshot; push and diff skip the schema phase. */
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

/**
 * Walk up from the starting dir like git, so the CLI works from any subdirectory.
 * undefined means nothing was found — profile-less operation stays first-class.
 */
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

/** The configuration file of one CLI run: every read and write of it goes through here. */
export interface ConfigStore {
	/** The resolved configuration path without reading the file, so env loading never depends on a parse. */
	path(): string | undefined;
	/** The parsed configuration, or undefined when there is none — profile-less operation stays first-class. */
	load(): LoadedConfig | undefined;
	require(): LoadedConfig;
	/**
	 * The stored profile for a name, or undefined when the name is free. A present result means the name is
	 * taken even when its `url` is undefined: a hand-edited profile with a missing or mangled `url` is still a
	 * NAMED profile (with a possibly-attached credential), so replacing it must clear the same gate as
	 * overwriting a valid URL. Tolerant like the upsert path: a not-yet-created explicit configuration is a fresh start.
	 */
	existingProfile(name: string): { url: string | undefined } | undefined;
	/**
	 * The validated profile for a name, or a CONFIG error naming the known profiles. The strict counterpart
	 * to `existingProfile`: commands that USE a profile need a parsed URL, commands that EDIT one need the
	 * tolerant raw read so a hand-broken entry stays repairable.
	 */
	requireProfile(name: string): Profile;
	/** Write a profile and return an operation that restores the preceding file state. */
	upsertProfile(name: string, profile: Profile): () => void;
	/** Move a profile to a new name, returning an operation that restores the preceding file state. */
	renameProfile(from: string, to: string): () => void;
	upsertProjectMode(project: string, mode: SyncMode): void;
	removeProfile(name: string): string | undefined;
}

/**
 * An explicit configuration path wins over discovery. Parsing stays lazy so profile add/remove can repair raw
 * configuration files that fail schema validation; a missing discovered configuration remains valid until `require()`.
 */
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

	function require(): LoadedConfig {
		const config = load();

		if (config === undefined) {
			throw new CliError('CONFIG', `No ${CONFIG_FILENAME} found.`, {
				hint: 'Create one first: d6s profile add <name> --url <url>',
			});
		}

		return config;
	}

	// Invalidate the cache after every write; new files also become the resolved path.
	function persisted(written: string): void {
		path = written;
		loaded = undefined;
		read = false;
	}

	return {
		path: () => path,
		load,
		require,
		existingProfile(name) {
			if (path === undefined) return undefined;

			const profiles = existingProfiles(readRawConfig(path), path);
			if (!Object.hasOwn(profiles, name)) return undefined;

			const profile = profiles[name];
			const url = isPlainObject(profile) ? (profile as Record<string, unknown>)['url'] : undefined;

			return { url: typeof url === 'string' ? url : undefined };
		},
		requireProfile(name) {
			const { config } = require();
			const profile = Object.hasOwn(config.profiles, name) ? config.profiles[name] : undefined;

			if (profile === undefined) {
				// Name the alternatives so a typo is fixable without opening the file.
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

			return () => {
				if (previousContents === undefined) {
					rmSync(target, { force: true });
				} else {
					writeFileAtomic(target, previousContents, 0o644);
				}

				path = previousPath;
				loaded = undefined;
				read = false;
			};
		},
		renameProfile(from, to) {
			// Capture the path: the restore runs later, and the outer binding can move on to another file.
			const target = path;

			if (target === undefined) throw new CliError('CONFIG', `No ${CONFIG_FILENAME} found.`);

			const previousContents = readFileSync(target, 'utf8');
			const raw = readRawConfig(target);
			const profiles = existingProfiles(raw, target);

			if (!Object.hasOwn(profiles, from)) throw new CliError('CONFIG', `Unknown profile: "${from}"`);

			// Renaming onto a live name would collapse two entries into one and silently drop a profile.
			if (Object.hasOwn(profiles, to)) throw new CliError('CONFIG', `Profile "${to}" already exists.`);

			// Rebuild in place so the renamed profile keeps its position instead of jumping to the end.
			const renamed = Object.fromEntries(
				Object.entries(profiles).map(([key, value]) => [key === from ? to : key, value]),
			);

			writeFileAtomic(target, `${JSON.stringify({ ...raw, profiles: renamed }, null, 2)}\n`, 0o644);
			persisted(target);

			return () => {
				writeFileAtomic(target, previousContents, 0o644);
				loaded = undefined;
				read = false;
			};
		},
		upsertProjectMode(project, mode) {
			const target = require().path;
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

			const removed = profiles[name];
			delete profiles[name];
			writeFileAtomic(path, `${JSON.stringify({ ...raw, profiles }, null, 2)}\n`, 0o644);
			persisted(path);

			return isPlainObject(removed) && typeof (removed as Record<string, unknown>)['url'] === 'string'
				? ((removed as Record<string, unknown>)['url'] as string)
				: undefined;
		},
	};
}
