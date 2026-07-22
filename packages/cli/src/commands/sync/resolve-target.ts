import { existsSync, realpathSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { resolveCredential, type ResolvedCredential } from '../../kernel/config/credentials.js';
import { loadConfig, type ProjectConfig, resolveProfile } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';

/** A resolved sync endpoint and its project-scoped artifact paths. */
export interface Target {
	readonly url: string;
	readonly credential: ResolvedCredential;
	readonly project: string;
	readonly schemaDir: string;
	readonly dataDir: string;
	readonly idMapPath: string;
	/**
	 * The config entry for this project, or undefined when the project is not declared (only `default`
	 * may go undeclared).
	 */
	readonly projectConfig: ProjectConfig | undefined;
}

// Project names become path segments, so separators and traversal components are forbidden.
const PROJECT_NAME = /^[a-z0-9][a-z0-9-_]*$/i;

// Resolve the deepest existing ancestor: a symlinked ancestor with a not-yet-created tail could otherwise
// redirect mkdir and every later write outside the project.
function assertContained(dir: string, realRoot: string): void {
	let probe = dir;

	while (!existsSync(probe)) probe = dirname(probe);

	const realProbe = realpathSync(probe);

	if (realProbe !== realRoot && !realProbe.startsWith(realRoot + sep)) {
		throw new CliError('STATE', `Directory ${dir} resolves outside the project ${realRoot}.`, {
			hint: 'The directory must live inside the project.',
		});
	}
}

export function resolveTarget(profileName: string, ctx: CliContext, projectName: string): Target {
	const loaded = loadConfig({ cwd: ctx.cwd, configPath: ctx.configPath });

	if (loaded === undefined) {
		throw new CliError('CONFIG', 'No directus.config.json found.', {
			hint: 'Create one first: d6s profile add <name> --url <url>',
		});
	}

	const { url } = resolveProfile(loaded.config, profileName);

	const resolution = resolveCredential({ target: 'profile', url, profileName });

	if (!resolution.found) {
		throw new CliError('AUTH', `No credential found for profile "${profileName}".`, {
			hint: `Set ${resolution.envVar}, or run d6s profile test ${profileName} to add one.`,
		});
	}

	if (!PROJECT_NAME.test(projectName)) {
		throw new CliError('CONFIG', `Invalid project name: "${projectName}".`, {
			hint: 'Use letters, digits, dashes, and underscores; start with a letter or digit.',
		});
	}

	// `default` is always valid without being declared; any other name must appear in config.projects so
	// a typo fails loudly rather than silently seeding a fresh, empty scope tree beside the real one.
	const declared = Object.hasOwn(loaded.config.projects, projectName) ? loaded.config.projects[projectName] : undefined;

	if (projectName !== 'default' && declared === undefined) {
		const defined = Object.keys(loaded.config.projects);

		throw new CliError('CONFIG', `Unknown project: "${projectName}".`, {
			hint:
				defined.length > 0
					? `Defined projects: ${defined.join(', ')}`
					: 'No projects are defined in directus.config.json.',
		});
	}

	// Anchor artifacts to the config directory so invocation cwd cannot move committed output.
	const projectRoot = dirname(loaded.path);
	const directoryRoot = join(projectRoot, loaded.config.directory);
	const projectDir = join(directoryRoot, projectName);
	const schemaDir = join(projectDir, 'schema');
	const dataDir = join(projectDir, 'data');
	const idMapPath = join(projectDir, 'id_map.json');

	// Check each write root independently because any component may already be a symlink.
	const realRoot = realpathSync(projectRoot);

	assertContained(directoryRoot, realRoot);
	assertContained(schemaDir, realRoot);
	assertContained(dataDir, realRoot);
	assertContained(dirname(idMapPath), realRoot);

	return {
		url,
		credential: resolution.credential,
		project: projectName,
		schemaDir,
		dataDir,
		idMapPath,
		projectConfig: declared,
	};
}
