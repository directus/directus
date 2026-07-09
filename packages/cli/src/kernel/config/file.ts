import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse as parsePath } from 'node:path';
import { z } from 'zod';
import { CliError } from '../error.js';

const CONFIG_FILENAME = 'directus.config.json';

// No secrets ever live here — this file is committable. Credentials resolve
// separately (env / ~/.directus/credentials.json / prompt).
const profileSchema = z.object({
	url: z.url(),
	auth: z.object({ type: z.literal('token') }).default({ type: 'token' }),
	// Protected profiles are never a default target and require sealed pushes in
	// CI. The wizard suggests this for anything not localhost.
	protect: z.boolean().default(false),
});

// The kernel owns `profiles` and `root`; any other top-level key (e.g. a future
// `sync` block) passes through untouched for its own consumer to read.
const configSchema = z.looseObject({
	root: z.string().default('directus'),
	profiles: z.record(z.string(), profileSchema).default({}),
});

// Public types are written by hand rather than `z.infer`red: isolatedDeclarations
// can't emit a declaration for a schema-derived export, and an explicit shape
// keeps the published .d.ts clean. The `config: parsed.data` return below is the
// compile-time check that the schema keeps producing this shape.
export interface Profile {
	readonly url: string;
	readonly auth: { readonly type: 'token' };
	readonly protect: boolean;
}

export interface Config {
	readonly root: string;
	readonly profiles: Readonly<Record<string, Profile>>;
	readonly [namespace: string]: unknown;
}

export interface LoadedConfig {
	readonly path: string;
	readonly config: Config;
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
export function loadConfig(options: { cwd: string; configPath?: string }): LoadedConfig | undefined {
	const path = options.configPath ?? findConfigPath(options.cwd);
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
