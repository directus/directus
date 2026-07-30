import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Project, ProjectManifest, ProjectRootDir, ProjectRootDirRealPath } from '@pnpm/types';
import { load } from 'js-yaml';
import { glob } from 'tinyglobby';

/**
 * Discovers the workspace packages declared in `pnpm-workspace.yaml`.
 *
 * This replaces `@pnpm/workspace.find-packages`, which pulled ~470 transitive packages into this
 * tool (including several stuck on unpatchable `brace-expansion` majors) to do what amounts to
 * "read the workspace globs and parse the matching package.json files".
 */
export async function findWorkspacePackages(workspaceRoot: string): Promise<Project[]> {
	const patterns = await readWorkspacePatterns(workspaceRoot);

	const manifestPaths = await glob(
		patterns.include.map((pattern) => `${pattern}/package.json`),
		{
			cwd: workspaceRoot,
			absolute: true,
			ignore: ['**/node_modules/**', ...patterns.exclude.map((pattern) => `${pattern}/package.json`)],
		},
	);

	const projects = await Promise.all(manifestPaths.map((manifestPath) => readProject(manifestPath)));

	// Stable ordering so downstream graph traversal and release notes don't depend on FS order
	return projects.sort((a, b) => a.rootDir.localeCompare(b.rootDir));
}

async function readWorkspacePatterns(workspaceRoot: string) {
	const raw = await readFile(join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf8');
	const parsed = load(raw) as { packages?: string[] } | undefined;
	const patterns = parsed?.packages ?? [];

	return {
		include: patterns.filter((pattern) => !pattern.startsWith('!')),
		exclude: patterns.filter((pattern) => pattern.startsWith('!')).map((pattern) => pattern.slice(1)),
	};
}

async function readProject(manifestPath: string): Promise<Project> {
	const raw = await readFile(manifestPath, 'utf8');
	const manifest = JSON.parse(raw) as ProjectManifest;
	const rootDir = resolve(manifestPath, '..');

	return {
		rootDir: rootDir as ProjectRootDir,
		rootDirRealPath: rootDir as ProjectRootDirRealPath,
		manifest,
		writeProjectManifest: async (updated: ProjectManifest) => {
			await writeFile(manifestPath, serializeManifest(updated, raw), 'utf8');
		},
	};
}

/**
 * Writes the manifest back using the indentation and trailing newline the file already had, so
 * version bumps don't reformat every package.json in the workspace.
 */
function serializeManifest(manifest: ProjectManifest, original: string) {
	const indentMatch = /^[^\n]*\n([ \t]+)/.exec(original);
	const indent = indentMatch?.[1] ?? '\t';
	const trailingNewline = original.endsWith('\n') ? '\n' : '';

	return `${JSON.stringify(manifest, null, indent)}${trailingNewline}`;
}
