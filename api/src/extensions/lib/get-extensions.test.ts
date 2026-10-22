import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../../logger/index.js';
import { getExtensions } from './get-extensions.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(),
}));

vi.mock('../../logger/index.js');

const logger = { warn: vi.fn() };

let root: string;

vi.mock('./get-extensions-path.js', () => ({
	getExtensionsPath: () => join(root, 'extensions'),
}));

async function writeExtension(path: string, name: string, type = 'hook') {
	await mkdir(path, { recursive: true });

	const options =
		type === 'bundle'
			? {
					type,
					path: { app: 'dist/app.js', api: 'dist/api.js' },
					entries: [{ type: 'hook', name: 'entry', source: 'src/entry.ts' }],
					host: '^10.0.0',
				}
			: { type, path: 'dist/index.js', source: 'src/index.ts', host: '^10.0.0' };

	await writeFile(
		join(path, 'package.json'),
		JSON.stringify({ name, version: '1.0.0', 'directus:extension': options }),
	);
}

async function writeRootPackage(dependencies: Record<string, string>) {
	await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'project', dependencies }));
}

beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 'directus-extensions-'));
	vi.mocked(useEnv).mockReturnValue({ PACKAGE_FILE_LOCATION: root });
	vi.mocked(useLogger).mockReturnValue(logger as any);
	logger.warn.mockReset();
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

describe('getExtensions', () => {
	test('should not load a local extension a second time when it is linked as a dependency', async () => {
		await writeExtension(join(root, 'extensions', 'my-extension'), 'my-extension');
		await mkdir(join(root, 'node_modules'));
		await symlink(join(root, 'extensions', 'my-extension'), join(root, 'node_modules', 'my-extension'), 'junction');
		await writeRootPackage({ 'my-extension': 'workspace:^' });

		const { local, module } = await getExtensions();

		expect([...local.keys()]).toEqual(['my-extension']);
		expect(module.size).toBe(0);
		expect(logger.warn).toHaveBeenCalledTimes(1);
	});

	test('should not load a local extension a second time when a copy is installed as a dependency', async () => {
		await writeExtension(join(root, 'extensions', 'my-extension'), 'my-extension');
		await writeExtension(join(root, 'node_modules', 'my-extension'), 'my-extension');
		await writeRootPackage({ 'my-extension': '^1.0.0' });

		const { local, module } = await getExtensions();

		expect([...local.keys()]).toEqual(['my-extension']);
		expect(module.size).toBe(0);
	});

	test('should keep a module extension that shares its name with a local extension of another type', async () => {
		await writeExtension(join(root, 'extensions', 'my-extension'), 'my-extension');
		await writeExtension(join(root, 'node_modules', 'my-extension'), 'my-extension', 'endpoint');
		await writeRootPackage({ 'my-extension': '^1.0.0' });

		const { module } = await getExtensions();

		expect([...module.keys()]).toEqual(['my-extension']);
	});

	test('should prefer a local extension over the same registry extension', async () => {
		await writeExtension(join(root, 'extensions', 'my-extension'), 'my-extension');
		await writeExtension(join(root, 'extensions', '.registry', 'registry-id'), 'my-extension');
		await writeRootPackage({});

		const { local, registry } = await getExtensions();

		expect([...local.keys()]).toEqual(['my-extension']);
		expect(registry.size).toBe(0);
	});

	test('should prefer a registry extension over the same module extension', async () => {
		await writeExtension(join(root, 'extensions', '.registry', 'registry-id'), 'my-extension');
		await writeExtension(join(root, 'node_modules', 'my-extension'), 'my-extension');
		await writeRootPackage({ 'my-extension': '^1.0.0' });

		const { registry, module } = await getExtensions();

		expect([...registry.keys()]).toEqual(['registry-id']);
		expect(module.size).toBe(0);
	});

	test('should not load a local bundle a second time when a copy is installed as a dependency', async () => {
		await writeExtension(join(root, 'extensions', 'my-bundle'), 'my-bundle', 'bundle');
		await writeExtension(join(root, 'node_modules', 'my-bundle'), 'my-bundle', 'bundle');
		await writeRootPackage({ 'my-bundle': '^1.0.0' });

		const { local, module } = await getExtensions();

		expect([...local.keys()]).toEqual(['my-bundle']);
		expect(module.size).toBe(0);
	});

	test('should keep local extensions in different folders that share a name', async () => {
		await writeExtension(join(root, 'extensions', 'hook-a'), 'my-extension');
		await writeExtension(join(root, 'extensions', 'hook-b'), 'my-extension');
		await writeRootPackage({});

		const { local } = await getExtensions();

		expect([...local.keys()].sort()).toEqual(['hook-a', 'hook-b']);
	});

	test('should keep module extensions that are not local extensions', async () => {
		await writeExtension(join(root, 'extensions', 'my-extension'), 'my-extension');
		await writeExtension(join(root, 'node_modules', 'other-extension'), 'other-extension');
		await writeRootPackage({ 'other-extension': '^1.0.0' });

		const { local, module } = await getExtensions();

		expect([...local.keys()]).toEqual(['my-extension']);
		expect([...module.keys()]).toEqual(['other-extension']);
	});
});
