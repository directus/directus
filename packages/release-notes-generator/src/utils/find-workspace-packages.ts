import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Project, ProjectManifest, ProjectRootDir, ProjectRootDirRealPath } from '@pnpm/types';
import { load } from 'js-yaml';

/**
 * Discovers the workspace packages declared in `pnpm-workspace.yaml`.
 */
export async function findWorkspacePackages(workspaceRoot: string): Promise<Project[]> {
	const { include, exclude } = await readWorkspacePatterns(workspaceRoot);

	const expandExcluded = () => Promise.all(exclude.map((pattern) => expandPattern(workspaceRoot, pattern)));
	const excluded = new Set(await expandExcluded().then((result) => result.flat()));

	const expandIncluded = () => Promise.all(include.map((pattern) => expandPattern(workspaceRoot, pattern)));
	const included = new Set(await expandIncluded().then((result) => result.flat()));

	const directories = [...included].filter((directory) => !excluded.has(directory));

	const manifests = await Promise.all(
		directories.map((directory) => readProject(join(workspaceRoot, directory, 'package.json'))),
	);

	const projects: Project[] = [];

	for (const project of manifests) {
		if (project !== null) {
			projects.push(project);
		}
	}

	// Stable ordering so downstream graph traversal and release notes don't depend on FS order
	return projects.sort((a, b) => a.rootDir.localeCompare(b.rootDir));
}

export async function readWorkspacePatterns(workspaceRoot: string) {
	const raw = await readFile(join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf8');
	const parsed = load(raw) as { packages?: string[] } | undefined;
	const patterns = parsed?.packages ?? [];

	const include: string[] = [];
	const exclude: string[] = [];

	for (const pattern of patterns) {
		if (pattern.startsWith('!')) {
			exclude.push(pattern.slice(1));
		} else {
			include.push(pattern);
		}
	}

	return { include, exclude };
}

/**
 * Expands a workspace pattern into the directories it matches, relative to the workspace root.
 *
 * Only the glob syntax pnpm workspaces actually use is supported: literal segments, `*` for a
 * single segment and `**` for any depth. Anything else throws rather than quietly matching
 * nothing, which would drop a package out of the release without anyone noticing.
 */
export async function expandPattern(workspaceRoot: string, pattern: string): Promise<string[]> {
	const segments = pattern.split('/').filter((segment) => segment !== '' && segment !== '.');
	let directories = [''];

	for (const segment of segments) {
		if (segment === '**') {
			directories = await Promise.all(directories.map((dir) => collectDescendants(workspaceRoot, dir))).then((result) =>
				result.flat(),
			);
		} else if (segment === '*') {
			directories = await Promise.all(directories.map((dir) => readSubdirectories(workspaceRoot, dir))).then((result) =>
				result.flat(),
			);
		} else if (segment.includes('*')) {
			throw new Error(`Unsupported workspace pattern '${pattern}': partial wildcards are not handled`);
		} else {
			directories = directories.map((dir) => (dir ? `${dir}/${segment}` : segment));
		}
	}

	return directories;
}

export async function readSubdirectories(workspaceRoot: string, directory: string): Promise<string[]> {
	let entries;

	try {
		entries = await readdir(join(workspaceRoot, directory), { withFileTypes: true });
	} catch (error) {
		// A pattern may point at a directory that doesn't exist in this checkout
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return [];
		}

		throw error;
	}

	const subdirectories: string[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name === 'node_modules') continue;

		subdirectories.push(directory ? `${directory}/${entry.name}` : entry.name);
	}

	return subdirectories;
}

export async function collectDescendants(workspaceRoot: string, directory: string): Promise<string[]> {
	const children = await readSubdirectories(workspaceRoot, directory);
	const nested = await Promise.all(children.map((child) => collectDescendants(workspaceRoot, child)));

	return [directory, ...nested.flat()];
}

export async function readProject(manifestPath: string): Promise<Project | null> {
	let raw: string;

	try {
		raw = await readFile(manifestPath, 'utf8');
	} catch (error) {
		// Matched directories don't necessarily hold a package
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return null;
		}

		throw error;
	}

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
export function serializeManifest(manifest: ProjectManifest, original: string) {
	const indentMatch = /^[^\n]*\n([ \t]+)/.exec(original);
	const indent = indentMatch?.[1] ?? '\t';
	const trailingNewline = original.endsWith('\n') ? '\n' : '';

	return `${JSON.stringify(manifest, null, indent)}${trailingNewline}`;
}
