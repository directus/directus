import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { ProjectManifest } from '@pnpm/types';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
	collectDescendants,
	expandPattern,
	findWorkspacePackages,
	readProject,
	readSubdirectories,
	readWorkspacePatterns,
	serializeManifest,
} from './find-workspace-packages.js';

/**
 * This module is nothing but filesystem traversal, so it's exercised against a real directory tree
 * in a temporary workspace rather than a stubbed `node:fs/promises`. A stub can't tell us whether
 * the module passes `withFileTypes` or the right encoding, which is most of what there is to get
 * wrong here.
 */
let root: string;

beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 'release-notes-generator-'));
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

/**
 * Creates a directory tree inside the temporary workspace root. Paths are relative to that root; a
 * key ending in `/` creates an empty directory, anything else a file holding the given content.
 * Parent directories are created as needed.
 */
async function seed(tree: Record<string, string>) {
	for (const [path, content] of Object.entries(tree)) {
		const absolute = join(root, path);

		if (path.endsWith('/')) {
			await mkdir(absolute, { recursive: true });
		} else {
			await mkdir(dirname(absolute), { recursive: true });
			await writeFile(absolute, content, 'utf8');
		}
	}
}

const manifest = (name: string, version = '1.0.0') => `{\n\t"name": "${name}",\n\t"version": "${version}"\n}\n`;

describe('readWorkspacePatterns', () => {
	test('should split include and exclude patterns', async () => {
		await seed({ 'pnpm-workspace.yaml': 'packages:\n  - packages/*\n  - "!packages/legacy"\n  - app\n' });

		await expect(readWorkspacePatterns(root)).resolves.toEqual({
			include: ['packages/*', 'app'],
			exclude: ['packages/legacy'],
		});
	});

	test('should return empty patterns when no packages are declared', async () => {
		await seed({ 'pnpm-workspace.yaml': 'catalog:\n  vitest: 1.0.0\n' });

		await expect(readWorkspacePatterns(root)).resolves.toEqual({ include: [], exclude: [] });
	});

	test('should return empty patterns for an empty workspace file', async () => {
		await seed({ 'pnpm-workspace.yaml': '' });

		await expect(readWorkspacePatterns(root)).resolves.toEqual({ include: [], exclude: [] });
	});

	test('should fail when the workspace file is missing', async () => {
		await expect(readWorkspacePatterns(root)).rejects.toThrow(/ENOENT/);
	});
});

describe('readSubdirectories', () => {
	test('should list directories relative to the workspace root', async () => {
		await seed({ 'packages/a/package.json': manifest('a'), 'packages/b/package.json': manifest('b') });

		// Sorted because the order `readdir` reports entries in isn't guaranteed
		expect((await readSubdirectories(root, 'packages')).sort()).toEqual(['packages/a', 'packages/b']);
	});

	test('should not prefix results when listing the workspace root', async () => {
		await seed({ 'app/package.json': manifest('app'), 'pnpm-workspace.yaml': '' });

		await expect(readSubdirectories(root, '')).resolves.toEqual(['app']);
	});

	test('should ignore files and node_modules', async () => {
		await seed({
			'packages/a/package.json': manifest('a'),
			'packages/node_modules/dep/package.json': manifest('dep'),
			'packages/README.md': '# packages',
		});

		await expect(readSubdirectories(root, 'packages')).resolves.toEqual(['packages/a']);
	});

	test('should return nothing for a directory missing from this checkout', async () => {
		await expect(readSubdirectories(root, 'packages')).resolves.toEqual([]);
	});

	test('should rethrow errors other than ENOENT', async () => {
		await seed({ packages: 'not a directory' });

		await expect(readSubdirectories(root, 'packages')).rejects.toThrow(/ENOTDIR/);
	});
});

describe('collectDescendants', () => {
	test('should include the directory itself and every descendant', async () => {
		await seed({
			'packages/a/package.json': manifest('a'),
			'packages/a/nested/deep/package.json': manifest('deep'),
			'packages/b/': '',
		});

		expect((await collectDescendants(root, 'packages')).sort()).toEqual([
			'packages',
			'packages/a',
			'packages/a/nested',
			'packages/a/nested/deep',
			'packages/b',
		]);
	});

	test('should not descend into node_modules', async () => {
		await seed({ 'packages/node_modules/dep/nested/package.json': manifest('dep') });

		await expect(collectDescendants(root, 'packages')).resolves.toEqual(['packages']);
	});
});

describe('expandPattern', () => {
	test('should return literal patterns without touching the filesystem', async () => {
		await expect(expandPattern(root, 'packages/does-not-exist')).resolves.toEqual(['packages/does-not-exist']);
	});

	test('should ignore leading dots and empty segments', async () => {
		await expect(expandPattern(root, './app/')).resolves.toEqual(['app']);
	});

	test('should expand the workspace root itself', async () => {
		await expect(expandPattern(root, '.')).resolves.toEqual(['']);
	});

	test('should expand a single wildcard to one level of directories', async () => {
		await seed({
			'packages/a/package.json': manifest('a'),
			'packages/b/nested/package.json': manifest('nested'),
		});

		expect((await expandPattern(root, 'packages/*')).sort()).toEqual(['packages/a', 'packages/b']);
	});

	test('should expand a double wildcard to any depth, including the base', async () => {
		await seed({ 'packages/a/nested/package.json': manifest('nested') });

		expect((await expandPattern(root, 'packages/**')).sort()).toEqual(['packages', 'packages/a', 'packages/a/nested']);
	});

	test('should combine wildcards with literal segments', async () => {
		await seed({
			'packages/a/src/package.json': manifest('a-src'),
			'packages/b/src/package.json': manifest('b-src'),
		});

		expect((await expandPattern(root, 'packages/*/src')).sort()).toEqual(['packages/a/src', 'packages/b/src']);
	});

	test('should return nothing when a wildcard has no matches', async () => {
		await expect(expandPattern(root, 'packages/*')).resolves.toEqual([]);
	});

	test('should throw on partial wildcards rather than silently matching nothing', async () => {
		await expect(expandPattern(root, 'packages/pkg-*')).rejects.toThrow(
			`Unsupported workspace pattern 'packages/pkg-*': partial wildcards are not handled`,
		);
	});
});

describe('readProject', () => {
	test('should read the manifest and resolve both root dirs', async () => {
		await seed({ 'packages/a/package.json': manifest('@directus/a', '2.3.4') });

		const project = await readProject(join(root, 'packages/a/package.json'));
		const rootDir = resolve(root, 'packages/a');

		expect(project).toMatchObject({
			rootDir,
			rootDirRealPath: rootDir,
			manifest: { name: '@directus/a', version: '2.3.4' },
		});
	});

	test('should return null for a matched directory without a package', async () => {
		await expect(readProject(join(root, 'packages/a/package.json'))).resolves.toBeNull();
	});

	test('should rethrow errors other than ENOENT', async () => {
		await seed({ 'packages/a/package.json/': '' });

		await expect(readProject(join(root, 'packages/a/package.json'))).rejects.toThrow(/EISDIR/);
	});

	test('should fail on a malformed manifest', async () => {
		await seed({ 'packages/a/package.json': '{ not json' });

		await expect(readProject(join(root, 'packages/a/package.json'))).rejects.toThrow(SyntaxError);
	});

	test('should write the manifest back in place', async () => {
		await seed({ 'packages/a/package.json': '{\n  "name": "a",\n  "version": "1.0.0"\n}\n' });

		const project = await readProject(join(root, 'packages/a/package.json'));

		await project!.writeProjectManifest({ ...project!.manifest, version: '1.1.0' });

		await expect(readFile(join(root, 'packages/a/package.json'), 'utf8')).resolves.toBe(
			'{\n  "name": "a",\n  "version": "1.1.0"\n}\n',
		);
	});
});

describe('serializeManifest', () => {
	const parsed: ProjectManifest = { name: 'a', version: '1.0.0' };

	test('should keep tab indentation', () => {
		expect(serializeManifest(parsed, '{\n\t"name": "a"\n}\n')).toBe('{\n\t"name": "a",\n\t"version": "1.0.0"\n}\n');
	});

	test('should keep space indentation', () => {
		expect(serializeManifest(parsed, '{\n    "name": "a"\n}\n')).toBe(
			'{\n    "name": "a",\n    "version": "1.0.0"\n}\n',
		);
	});

	test('should fall back to tab indentation when it cannot be detected', () => {
		expect(serializeManifest(parsed, '{"name":"a"}')).toBe('{\n\t"name": "a",\n\t"version": "1.0.0"\n}');
	});

	test('should preserve a missing trailing newline', () => {
		expect(serializeManifest(parsed, '{\n\t"name": "a"\n}')).not.toMatch(/\n$/);
	});
});

describe('findWorkspacePackages', () => {
	test('should discover the packages matched by the workspace globs', async () => {
		await seed({
			'pnpm-workspace.yaml': 'packages:\n  - app\n  - packages/*\n',
			'app/package.json': manifest('app'),
			'packages/a/package.json': manifest('a'),
			'packages/b/package.json': manifest('b'),
			'packages/node_modules/dep/package.json': manifest('dep'),
		});

		const projects = await findWorkspacePackages(root);

		expect(projects.map((project) => project.manifest.name)).toEqual(['app', 'a', 'b']);
	});

	test('should sort projects by root dir', async () => {
		await seed({
			'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
			'packages/c/package.json': manifest('c'),
			'packages/a/package.json': manifest('a'),
			'packages/b/package.json': manifest('b'),
		});

		const projects = await findWorkspacePackages(root);

		expect(projects.map((project) => project.rootDir)).toEqual([
			resolve(root, 'packages/a'),
			resolve(root, 'packages/b'),
			resolve(root, 'packages/c'),
		]);
	});

	test('should drop directories excluded by a negated pattern', async () => {
		await seed({
			'pnpm-workspace.yaml': 'packages:\n  - packages/*\n  - "!packages/legacy"\n',
			'packages/a/package.json': manifest('a'),
			'packages/legacy/package.json': manifest('legacy'),
		});

		const projects = await findWorkspacePackages(root);

		expect(projects.map((project) => project.manifest.name)).toEqual(['a']);
	});

	test('should exclude entire subtrees via a negated wildcard', async () => {
		await seed({
			'pnpm-workspace.yaml': 'packages:\n  - packages/**\n  - "!packages/a/**"\n',
			'packages/a/package.json': manifest('a'),
			'packages/a/fixture/package.json': manifest('a-fixture'),
			'packages/b/package.json': manifest('b'),
		});

		const projects = await findWorkspacePackages(root);

		expect(projects.map((project) => project.manifest.name)).toEqual(['b']);
	});

	test('should return a package matched by several patterns only once', async () => {
		await seed({
			'pnpm-workspace.yaml': 'packages:\n  - packages/*\n  - packages/a\n',
			'packages/a/package.json': manifest('a'),
		});

		const projects = await findWorkspacePackages(root);

		expect(projects.map((project) => project.manifest.name)).toEqual(['a']);
	});

	test('should skip matched directories that hold no package', async () => {
		await seed({
			'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
			'packages/a/package.json': manifest('a'),
			'packages/shared/README.md': '# no manifest here',
		});

		const projects = await findWorkspacePackages(root);

		expect(projects.map((project) => project.manifest.name)).toEqual(['a']);
	});

	test('should return nothing when no patterns are declared', async () => {
		await seed({ 'pnpm-workspace.yaml': 'packages: []\n' });

		await expect(findWorkspacePackages(root)).resolves.toEqual([]);
	});
});
