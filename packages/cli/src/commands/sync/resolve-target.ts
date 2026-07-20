import { dirname, join } from 'node:path';
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
	const schemaDir = join(dirname(loaded.path), 'directus', 'default', 'schema');

	return { url, credential: resolution.credential, schemaDir };
}
