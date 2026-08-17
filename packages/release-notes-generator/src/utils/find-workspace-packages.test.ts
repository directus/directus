import { resolve } from 'node:path';
import type { ProjectManifest } from '@pnpm/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
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
 * In-memory stand-in for the bits of `node:fs/promises` this module uses. Defined inside
 * `vi.hoisted` so the mock factory can reach it without tripping over the TDZ.
 */
const { ROOT, vfs } = vi.hoisted(() => {
	const ROOT = '/workspace';

	const normalize = (path: string) => path.replace(/\\/g, '/').replace(/\/+$/, '');

	const files = new Map<string, string>();
	const dirs = new Set<string>();

	const error = (code: string, message: string) => {
		const err = new Error(`${code}: ${message}`) as NodeJS.ErrnoException;
		err.code = code;
		return err;
	};

	const dirExists = (dir: string) =>
		dirs.has(dir) || [...files.keys(), ...dirs].some((path) => path.startsWith(`${dir}/`));

	const vfs = {
		reset() {
			files.clear();
			dirs.clear();
		},
		/**
		 * Paths are relative to the workspace root. A string value seeds a file, a key ending in `/`
		 * seeds an empty directory. Parent directories are implied.
		 */
		seed(tree: Record<string, string>) {
			for (const [path, content] of Object.entries(tree)) {
				const absolute = normalize(`${ROOT}/${path}`);
				if (path.endsWith('/')) dirs.add(absolute);
				else files.set(absolute, content);
			}
		},
		get(path: string) {
			return files.get(normalize(`${ROOT}/${path}`));
		},
		readFile(path: string) {
			const target = normalize(path);
			const content = files.get(target);
			if (content !== undefined) return content;
			if (dirExists(target)) throw error('EISDIR', `illegal operation on a directory, read '${target}'`);
			throw error('ENOENT', `no such file or directory, open '${target}'`);
		},
		readdir(path: string) {
			const target = normalize(path);
			if (files.has(target)) throw error('ENOTDIR', `not a directory, scandir '${target}'`);
			if (!dirExists(target)) throw error('ENOENT', `no such file or directory, scandir '${target}'`);

			const children = new Map<string, boolean>();

			for (const candidate of [...files.keys(), ...dirs]) {
				if (!candidate.startsWith(`${target}/`)) continue;
				const [name, ...rest] = candidate.slice(target.length + 1).split('/');
				const isDirectory = rest.length > 0 || dirs.has(candidate);
				children.set(name!, (children.get(name!) ?? false) || isDirectory);
			}

			return [...children].map(([name, isDirectory]) => ({ name, isDirectory: () => isDirectory }));
		},
		writeFile(path: string, content: string) {
			files.set(normalize(path), content);
		},
	};

	return { ROOT, vfs };
});

vi.mock('node:fs/promises', () => ({
	readFile: vi.fn(async (path: string) => vfs.readFile(path)),
	readdir: vi.fn(async (path: string) => vfs.readdir(path)),
	writeFile: vi.fn(async (path: string, content: string) => vfs.writeFile(path, content)),
}));

const manifest = (name: string, version = '1.0.0') => `{\n\t"name": "${name}",\n\t"version": "${version}"\n}\n`;

beforeEach(() => {
	vfs.reset();
});

describe('readWorkspacePatterns', () => {
	test('should split include and exclude patterns', async () => {
		vfs.seed({ 'pnpm-workspace.yaml': 'packages:\n  - packages/*\n  - "!packages/legacy"\n  - app\n' });

		await expect(readWorkspacePatterns(ROOT)).resolves.toEqual({
			include: ['packages/*', 'app'],
			exclude: ['packages/legacy'],
		});
	});

	test('should return empty patterns when no packages are declared', async () => {
		vfs.seed({ 'pnpm-workspace.yaml': 'catalog:\n  vitest: 1.0.0\n' });

		await expect(readWorkspacePatterns(ROOT)).resolves.toEqual({ include: [], exclude: [] });
	});

	test('should return empty patterns for an empty workspace file', async () => {
		vfs.seed({ 'pnpm-workspace.yaml': '' });

		await expect(readWorkspacePatterns(ROOT)).resolves.toEqual({ include: [], exclude: [] });
	});

	test('should fail when the workspace file is missing', async () => {
		await expect(readWorkspacePatterns(ROOT)).rejects.toThrow(/ENOENT/);
	});
});

describe('readSubdirectories', () => {
	test('should list directories relative to the workspace root', async () => {
		vfs.seed({ 'packages/a/package.json': manifest('a'), 'packages/b/package.json': manifest('b') });

		await expect(readSubdirectories(ROOT, 'packages')).resolves.toEqual(['packages/a', 'packages/b']);
	});

	test('should not prefix results when listing the workspace root', async () => {
		vfs.seed({ 'app/package.json': manifest('app'), 'pnpm-workspace.yaml': '' });

		await expect(readSubdirectories(ROOT, '')).resolves.toEqual(['app']);
	});

	test('should ignore files and node_modules', async () => {
		vfs.seed({
			'packages/a/package.json': manifest('a'),
			'packages/node_modules/dep/package.json': manifest('dep'),
			'packages/README.md': '# packages',
		});

		await expect(readSubdirectories(ROOT, 'packages')).resolves.toEqual(['packages/a']);
	});

	test('should return nothing for a directory missing from this checkout', async () => {
		await expect(readSubdirectories(ROOT, 'packages')).resolves.toEqual([]);
	});

	test('should rethrow errors other than ENOENT', async () => {
		vfs.seed({ packages: 'not a directory' });

		await expect(readSubdirectories(ROOT, 'packages')).rejects.toThrow(/ENOTDIR/);
	});
});

describe('collectDescendants', () => {
	test('should include the directory itself and every descendant', async () => {
		vfs.seed({
			'packages/a/package.json': manifest('a'),
			'packages/a/nested/deep/package.json': manifest('deep'),
			'packages/b/': '',
		});

		await expect(collectDescendants(ROOT, 'packages')).resolves.toEqual([
			'packages',
			'packages/a',
			'packages/a/nested',
			'packages/a/nested/deep',
			'packages/b',
		]);
	});

	test('should not descend into node_modules', async () => {
		vfs.seed({ 'packages/node_modules/dep/nested/package.json': manifest('dep') });

		await expect(collectDescendants(ROOT, 'packages')).resolves.toEqual(['packages']);
	});
});

describe('expandPattern', () => {
	test('should return literal patterns without touching the filesystem', async () => {
		await expect(expandPattern(ROOT, 'packages/does-not-exist')).resolves.toEqual(['packages/does-not-exist']);
	});

	test('should ignore leading dots and empty segments', async () => {
		await expect(expandPattern(ROOT, './app/')).resolves.toEqual(['app']);
	});

	test('should expand the workspace root itself', async () => {
		await expect(expandPattern(ROOT, '.')).resolves.toEqual(['']);
	});

	test('should expand a single wildcard to one level of directories', async () => {
		vfs.seed({
			'packages/a/package.json': manifest('a'),
			'packages/b/nested/package.json': manifest('nested'),
		});

		await expect(expandPattern(ROOT, 'packages/*')).resolves.toEqual(['packages/a', 'packages/b']);
	});

	test('should expand a double wildcard to any depth, including the base', async () => {
		vfs.seed({ 'packages/a/nested/package.json': manifest('nested') });

		await expect(expandPattern(ROOT, 'packages/**')).resolves.toEqual(['packages', 'packages/a', 'packages/a/nested']);
	});

	test('should combine wildcards with literal segments', async () => {
		vfs.seed({
			'packages/a/src/package.json': manifest('a-src'),
			'packages/b/src/package.json': manifest('b-src'),
		});

		await expect(expandPattern(ROOT, 'packages/*/src')).resolves.toEqual(['packages/a/src', 'packages/b/src']);
	});

	test('should return nothing when a wildcard has no matches', async () => {
		await expect(expandPattern(ROOT, 'packages/*')).resolves.toEqual([]);
	});

	test('should throw on partial wildcards rather than silently matching nothing', async () => {
		await expect(expandPattern(ROOT, 'packages/pkg-*')).rejects.toThrow(
			`Unsupported workspace pattern 'packages/pkg-*': partial wildcards are not handled`,
		);
	});
});

describe('readProject', () => {
	test('should read the manifest and resolve both root dirs', async () => {
		vfs.seed({ 'packages/a/package.json': manifest('@directus/a', '2.3.4') });

		const project = await readProject(`${ROOT}/packages/a/package.json`);
		const rootDir = resolve(ROOT, 'packages/a');

		expect(project).toMatchObject({
			rootDir,
			rootDirRealPath: rootDir,
			manifest: { name: '@directus/a', version: '2.3.4' },
		});
	});

	test('should return null for a matched directory without a package', async () => {
		await expect(readProject(`${ROOT}/packages/a/package.json`)).resolves.toBeNull();
	});

	test('should rethrow errors other than ENOENT', async () => {
		vfs.seed({ 'packages/a/package.json/nested': '' });

		await expect(readProject(`${ROOT}/packages/a/package.json`)).rejects.toThrow(/EISDIR/);
	});

	test('should fail on a malformed manifest', async () => {
		vfs.seed({ 'packages/a/package.json': '{ not json' });

		await expect(readProject(`${ROOT}/packages/a/package.json`)).rejects.toThrow(SyntaxError);
	});

	test('should write the manifest back in place', async () => {
		vfs.seed({ 'packages/a/package.json': '{\n  "name": "a",\n  "version": "1.0.0"\n}\n' });

		const project = await readProject(`${ROOT}/packages/a/package.json`);

		await project!.writeProjectManifest({ ...project!.manifest, version: '1.1.0' });

		expect(vfs.get('packages/a/package.json')).toBe('{\n  "name": "a",\n  "version": "1.1.0"\n}\n');
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
		vfs.seed({
			'pnpm-workspace.yaml': 'packages:\n  - app\n  - packages/*\n',
			'app/package.json': manifest('app'),
			'packages/a/package.json': manifest('a'),
			'packages/b/package.json': manifest('b'),
			'packages/node_modules/dep/package.json': manifest('dep'),
		});

		const projects = await findWorkspacePackages(ROOT);

		expect(projects.map((project) => project.manifest.name)).toEqual(['app', 'a', 'b']);
	});

	test('should sort projects by root dir', async () => {
		vfs.seed({
			'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
			'packages/c/package.json': manifest('c'),
			'packages/a/package.json': manifest('a'),
			'packages/b/package.json': manifest('b'),
		});

		const projects = await findWorkspacePackages(ROOT);

		expect(projects.map((project) => project.rootDir)).toEqual([
			resolve(ROOT, 'packages/a'),
			resolve(ROOT, 'packages/b'),
			resolve(ROOT, 'packages/c'),
		]);
	});

	test('should drop directories excluded by a negated pattern', async () => {
		vfs.seed({
			'pnpm-workspace.yaml': 'packages:\n  - packages/*\n  - "!packages/legacy"\n',
			'packages/a/package.json': manifest('a'),
			'packages/legacy/package.json': manifest('legacy'),
		});

		const projects = await findWorkspacePackages(ROOT);

		expect(projects.map((project) => project.manifest.name)).toEqual(['a']);
	});

	test('should exclude entire subtrees via a negated wildcard', async () => {
		vfs.seed({
			'pnpm-workspace.yaml': 'packages:\n  - packages/**\n  - "!packages/a/**"\n',
			'packages/a/package.json': manifest('a'),
			'packages/a/fixture/package.json': manifest('a-fixture'),
			'packages/b/package.json': manifest('b'),
		});

		const projects = await findWorkspacePackages(ROOT);

		expect(projects.map((project) => project.manifest.name)).toEqual(['b']);
	});

	test('should return a package matched by several patterns only once', async () => {
		vfs.seed({
			'pnpm-workspace.yaml': 'packages:\n  - packages/*\n  - packages/a\n',
			'packages/a/package.json': manifest('a'),
		});

		const projects = await findWorkspacePackages(ROOT);

		expect(projects.map((project) => project.manifest.name)).toEqual(['a']);
	});

	test('should skip matched directories that hold no package', async () => {
		vfs.seed({
			'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
			'packages/a/package.json': manifest('a'),
			'packages/shared/README.md': '# no manifest here',
		});

		const projects = await findWorkspacePackages(ROOT);

		expect(projects.map((project) => project.manifest.name)).toEqual(['a']);
	});

	test('should return nothing when no patterns are declared', async () => {
		vfs.seed({ 'pnpm-workspace.yaml': 'packages: []\n' });

		await expect(findWorkspacePackages(ROOT)).resolves.toEqual([]);
	});
});
