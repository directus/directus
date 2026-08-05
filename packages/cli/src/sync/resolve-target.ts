import { existsSync, realpathSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { envTokenVar, resolveCredential, type ResolvedCredential } from '../kernel/config/credentials.js';
import { type ProjectConfig, resolveProfile } from '../kernel/config/file.js';
import { CliError } from '../kernel/error.js';
import type { CliContext } from '../kernel/run.js';

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

/** The one project scope that needs no config entry. */
export const DEFAULT_PROJECT = 'default';

const PROJECT_NAME = /^[a-z0-9][a-z0-9-_]*$/i;

// A symlinked ancestor can redirect a not-yet-created tail outside the project.
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

export function resolveTarget(profileName: string, projectName: string, ctx: CliContext): Target {
	const loaded = ctx.config.require();

	// The free checks first: neither costs a credential-store read that can fail on its own.
	if (!PROJECT_NAME.test(projectName)) {
		throw new CliError('CONFIG', `Invalid project name: "${projectName}".`, {
			hint: 'Use letters, digits, dashes, and underscores; start with a letter or digit.',
		});
	}

	const declared = Object.hasOwn(loaded.config.projects, projectName) ? loaded.config.projects[projectName] : undefined;

	if (projectName !== DEFAULT_PROJECT && declared === undefined) {
		const defined = Object.keys(loaded.config.projects);

		throw new CliError('CONFIG', `Unknown project: "${projectName}".`, {
			hint:
				defined.length > 0
					? `Defined projects: ${defined.join(', ')}`
					: 'No projects are defined in directus.config.json.',
		});
	}

	const { url } = resolveProfile(loaded.config, profileName);

	const projectRoot = dirname(loaded.path);
	const directoryRoot = join(projectRoot, loaded.config.directory);
	const projectDir = join(directoryRoot, projectName);
	const schemaDir = join(projectDir, 'schema');
	const dataDir = join(projectDir, 'data');
	const idMapPath = join(projectDir, 'id_map.json');

	const realRoot = realpathSync(projectRoot);

	assertContained(directoryRoot, realRoot);
	assertContained(schemaDir, realRoot);
	assertContained(dataDir, realRoot);
	assertContained(dirname(idMapPath), realRoot);

	const credential = resolveCredential({ target: 'profile', url, profileName });

	if (credential === undefined) {
		throw new CliError('AUTH', `No credential found for profile "${profileName}".`, {
			hint: `Set ${envTokenVar(profileName)}, or run d6s profile test ${profileName} to add one.`,
		});
	}

	return {
		url,
		credential,
		project: projectName,
		schemaDir,
		dataDir,
		idMapPath,
		projectConfig: declared,
	};
}
