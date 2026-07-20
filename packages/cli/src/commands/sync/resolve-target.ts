import { existsSync, realpathSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { resolveCredential, type ResolvedCredential } from '../../kernel/config/credentials.js';
import { loadConfig, resolveProfile } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';

// The config → profile → credential → schema-dir preamble shared by every sync command. Extracted
// so pull and diff resolve their target through one path and their error semantics can never drift.
export interface Target {
	readonly url: string;
	readonly credential: ResolvedCredential;
	readonly schemaDir: string;
}

export function resolveTarget(profileName: string, ctx: CliContext): Target {
	const loaded = loadConfig({ cwd: ctx.cwd, configPath: ctx.configPath });

	if (loaded === undefined) {
		throw new CliError('CONFIG', 'No directus.config.json found.', {
			hint: 'Create one first: d6s profile add <name> --url <url>',
		});
	}

	const { url } = resolveProfile(loaded.config, profileName);

	// Never prompts. Authentication decisions are recorded once at profile / scope-definition time
	// and only read back here, so a sync command behaves identically locally and in CI.
	const resolution = resolveCredential({ target: 'profile', url, profileName });

	if (!resolution.found) {
		throw new CliError('AUTH', `No credential found for profile "${profileName}".`, {
			hint: `Set ${resolution.envVar}, or run d6s profile test ${profileName} to add one.`,
		});
	}

	// Anchor artifacts to the config file's directory, not the invocation cwd, so they land in the
	// repo no matter where the command runs from. `directus/<project>/schema` is the committable
	// layout; the project slot is fixed to `default` until project config lands.
	const projectRoot = dirname(loaded.path);
	const schemaDir = join(projectRoot, 'directus', 'default', 'schema');

	// This is the only production constructor of schemaDir and the layer that knows the project
	// boundary, so containment is enforced here: repo content must never be able to point sync writes
	// or deletes outside the repo. The check anchors on the deepest EXISTING ancestor of schemaDir,
	// not schemaDir itself: a symlinked ancestor (e.g. a committed `directus` -> /elsewhere) with a
	// not-yet-created tail would pass an exists-only check and mkdir would then build the tail through
	// the symlink. Components below the checked ancestor are created by pull as real directories, so
	// containment of that ancestor contains every write. realpathSync resolves symlinks on both sides;
	// internal symlinks that stay inside are fine, an escape is refused.
	let probe = schemaDir;
	while (!existsSync(probe)) probe = dirname(probe);

	const realRoot = realpathSync(projectRoot);
	const realProbe = realpathSync(probe);

	if (realProbe !== realRoot && !realProbe.startsWith(realRoot + sep)) {
		throw new CliError('STATE', `Schema directory ${schemaDir} resolves outside the project ${realRoot}.`, {
			hint: 'The schema directory must live inside the project.',
		});
	}

	return { url, credential: resolution.credential, schemaDir };
}
