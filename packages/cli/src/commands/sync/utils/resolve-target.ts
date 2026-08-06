import { existsSync, realpathSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { envTokenVar, resolveCredential, type ResolvedCredential } from '../../../kernel/config/credentials.js';
import type { ProjectConfig } from '../../../kernel/config/file.js';
import { isCI } from '../../../kernel/env.js';
import { CliError } from '../../../kernel/error.js';
import type { CliContext } from '../../../kernel/run.js';

/** A resolved sync endpoint and its project-scoped artifact paths. */
export interface Target {
	readonly profile: string;
	readonly url: string;
	readonly credential: ResolvedCredential;
	readonly project: string;
	readonly projectDir: string;
	readonly schemaDir: string;
	readonly dataDir: string;
	readonly idMapPath: string;
	/**
	 * The configuration entry for this project, or undefined when the project is not declared (only `default`
	 * may go undeclared).
	 */
	readonly projectConfig: ProjectConfig | undefined;
}

/** The one project scope that needs no configuration entry. */
export const DEFAULT_PROJECT = 'default';

const PROJECT_NAME = /^[a-z0-9][a-z0-9-_]*$/i;

/** Render a project path relative to the invocation directory, with an explicit local `./` prefix. */
export function displayProjectPath(cwd: string, projectDir: string): string {
	const local = relative(cwd, projectDir);
	if (local === '') return '.';
	return local.startsWith('.') ? local : `./${local}`;
}

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

	const { url } = ctx.config.requireProfile(profileName);

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
		if (isCI()) {
			throw new CliError('AUTH', `CI token missing for profile "${profileName}".`, {
				hint: `Set ${envTokenVar(profileName)} in your CI environment. Saved profile credentials are local-only and are not read in CI.`,
			});
		}

		throw new CliError('AUTH', `No credential found for profile "${profileName}".`, {
			hint: `Set ${envTokenVar(profileName)}, or run d6s profile test ${profileName} to add one.`,
		});
	}

	return {
		profile: profileName,
		url,
		credential,
		project: projectName,
		projectDir,
		schemaDir,
		dataDir,
		idMapPath,
		projectConfig: declared,
	};
}
