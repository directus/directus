import { existsSync, realpathSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { resolveCredential, type ResolvedCredential } from '../../kernel/config/credentials.js';
import { loadConfig, type ProjectConfig, resolveProfile } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';

/**
 * The config → profile → credential → artifact-dir preamble shared by every sync command. Extracted
 * so pull and diff resolve their target through one path and their error semantics can never drift.
 */
export interface Target {
	readonly url: string;
	readonly credential: ResolvedCredential;
	readonly project: string;
	readonly schemaDir: string;
	readonly dataDir: string;
	readonly idMapPath: string;
	/**
	 * The config entry for this project, or undefined when the project is not declared (only `default`
	 * may go undeclared). Later slices read its scope defaults; the pull layer already does.
	 */
	readonly projectConfig: ProjectConfig | undefined;
}

// A project name is a single path segment (<dir>/<project>/…), so it must carry no separators or dots:
// a name that could climb out of the artifact tree is refused before it is ever joined into a path.
const PROJECT_NAME = /^[a-z0-9][a-z0-9-_]*$/i;

// Containment enforced here — the only production constructor of these dirs and the layer that knows the
// project boundary — so repo content can never point sync writes or deletes outside the repo. Both the
// configurable `directory` root and the per-project leaves are checked, because either can be redirected:
// the `directory` key is a repo-relative path a config author controls, and the leaves live under it. The
// check anchors on the deepest EXISTING ancestor of `dir`, not `dir` itself: a symlinked ancestor (e.g. a
// committed `directus` -> /elsewhere) with a not-yet-created tail would pass an exists-only check and
// mkdir would then build the tail through the symlink. Components below the checked ancestor are created
// by pull as real directories, so containment of that ancestor contains every write. realpathSync
// resolves symlinks on both sides; internal symlinks that stay inside are fine, an escape is refused.
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

	// Never prompts. Authentication decisions are recorded once at profile / scope-definition time
	// and only read back here, so a sync command behaves identically locally and in CI.
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

	// Anchor artifacts to the config file's directory, not the invocation cwd, so they land in the repo
	// no matter where the command runs from. `<directory>/<project>/{schema,data,id_map.json}` is the
	// committable layout; `directory` is the configured (repo-relative, possibly nested) root.
	const projectRoot = dirname(loaded.path);
	const directoryRoot = join(projectRoot, loaded.config.directory);
	const projectDir = join(directoryRoot, projectName);
	const schemaDir = join(projectDir, 'schema');
	const dataDir = join(projectDir, 'data');
	const idMapPath = join(projectDir, 'id_map.json');

	// The configured root, both leaves, and the id map's parent are each containment-checked: any of them
	// can be redirected out of the repo via a symlink or a `..`-bearing `directory`, and each is a write
	// target, so each must resolve inside the project.
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
