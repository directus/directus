import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse as parsePath } from 'node:path';
import { z } from 'zod';
import { type CliError, cliError, err, ok, type Result } from '../result.js';

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

// Plugin namespaces (e.g. `sync`) ride alongside the kernel keys and are
// validated by each plugin's own schema, so unknown top-level keys pass through.
const configSchema = z.looseObject({
	root: z.string().default('directus'),
	plugins: z.array(z.string()).default([]),
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
	readonly plugins: readonly string[];
	readonly profiles: Readonly<Record<string, Profile>>;
	// Plugin namespaces (e.g. `sync`) ride alongside, validated by their own schema.
	readonly [namespace: string]: unknown;
}

export interface LoadedConfig {
	readonly path: string;
	readonly config: Config;
}

// Walk up from the starting directory like git does, so the CLI works from any
// subdirectory of a project. Returns undefined when nothing is found —
// profile-less operation (`--url` + `--token`) is a first-class path.
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

// Resolves a config: an explicit `--config` path wins, otherwise walk-up
// discovery. A missing discovered file is not an error (profile-less); a missing
// explicit path or a malformed file is.
export function loadConfig(options: { cwd: string; configPath?: string }): Result<LoadedConfig | undefined, CliError> {
	const path = options.configPath ?? findConfigPath(options.cwd);
	if (path === undefined) return ok(undefined);

	let raw: string;

	try {
		raw = readFileSync(path, 'utf8');
	} catch {
		return err(cliError('CONFIG', `Cannot read config file: ${path}`));
	}

	let json: unknown;

	try {
		json = JSON.parse(raw);
	} catch {
		return err(cliError('CONFIG', `${path} is not valid JSON.`));
	}

	const parsed = configSchema.safeParse(json);
	if (!parsed.success) return err(cliError('CONFIG', `Invalid config in ${path}:\n${z.prettifyError(parsed.error)}`));

	return ok({ path, config: parsed.data });
}
