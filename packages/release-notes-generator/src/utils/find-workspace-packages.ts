import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Project, ProjectManifest, ProjectRootDir, ProjectRootDirRealPath } from '@pnpm/types';
import { load } from 'js-yaml';

/**
 * Discovers the workspace packages declared in `pnpm-workspace.yaml`.
 *
 * This replaces `@pnpm/workspace.find-packages`, which pulled ~470 transitive packages into this
 * tool (including several stuck on unpatchable `brace-expansion` majors) to do what amounts to
 * "read the workspace globs and parse the matching package.json files".
 */
export async function findWorkspacePackages(workspaceRoot: string): Promise<Project[]> {
	const { include, exclude } = await readWorkspacePatterns(workspaceRoot);

	const excluded = new Set((await Promise.all(exclude.map((pattern) => expandPattern(workspaceRoot, pattern)))).flat());

	const included = (await Promise.all(include.map((pattern) => expandPattern(workspaceRoot, pattern)))).flat();

	const directories = [...new Set(included)].filter((directory) => !excluded.has(directory));

	const projects = await Promise.all(
		directories.map((directory) => readProject(join(workspaceRoot, directory, 'package.json'))),
	);

	// Stable ordering so downstream graph traversal and release notes don't depend on FS order
	return projects
		.filter((project): project is Project => project !== null)
		.sort((a, b) => a.rootDir.localeCompare(b.rootDir));
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

/**
 * Expands a workspace pattern into the directories it matches, relative to the workspace root.
 *
 * Only the glob syntax pnpm workspaces actually use is supported: literal segments, `*` for a
 * single segment and `**` for any depth. Anything else throws rather than quietly matching
 * nothing, which would drop a package out of the release without anyone noticing.
 */
async function expandPattern(workspaceRoot: string, pattern: string): Promise<string[]> {
	const segments = pattern.split('/').filter((segment) => segment !== '' && segment !== '.');
	let directories = [''];

	for (const segment of segments) {
		if (segment === '**') {
			directories = (await Promise.all(directories.map((dir) => collectDescendants(workspaceRoot, dir)))).flat();
		} else if (segment === '*') {
			directories = (await Promise.all(directories.map((dir) => readSubdirectories(workspaceRoot, dir)))).flat();
		} else if (segment.includes('*')) {
			throw new Error(`Unsupported workspace pattern '${pattern}': partial wildcards are not handled`);
		} else {
			directories = directories.map((dir) => (dir ? `${dir}/${segment}` : segment));
		}
	}

	return directories;
}

async function readSubdirectories(workspaceRoot: string, directory: string): Promise<string[]> {
	let entries;

	try {
		entries = await readdir(join(workspaceRoot, directory), { withFileTypes: true });
	} catch (error) {
		// A pattern may point at a directory that doesn't exist in this checkout
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw error;
	}

	return entries
		.filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
		.map((entry) => (directory ? `${directory}/${entry.name}` : entry.name));
}

async function collectDescendants(workspaceRoot: string, directory: string): Promise<string[]> {
	const children = await readSubdirectories(workspaceRoot, directory);
	const nested = await Promise.all(children.map((child) => collectDescendants(workspaceRoot, child)));

	return [directory, ...nested.flat()];
}

async function readProject(manifestPath: string): Promise<Project | null> {
	let raw: string;

	try {
		raw = await readFile(manifestPath, 'utf8');
	} catch (error) {
		// Matched directories don't necessarily hold a package
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
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
function serializeManifest(manifest: ProjectManifest, original: string) {
	const indentMatch = /^[^\n]*\n([ \t]+)/.exec(original);
	const indent = indentMatch?.[1] ?? '\t';
	const trailingNewline = original.endsWith('\n') ? '\n' : '';

	return `${JSON.stringify(manifest, null, indent)}${trailingNewline}`;
}
