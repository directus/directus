import { Config } from '../types.js';
import type { Project } from '@pnpm/workspace.find-packages';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../config.js', () => {
	const config: Partial<Config> = {
		mainPackage: 'main',
		untypedPackageTitles: {},
		packageOrder: [],
		linkedPackages: [['trigger', 'target']],
	};

	return { default: config };
});

let mockChangesetPreFile: string | undefined = undefined;

vi.doMock('node:fs', () => {
	return {
		existsSync: (path: string) => {
			if (path.startsWith('mock')) return true;
			return false;
		},
		unlinkSync: () => null,
		readFileSync: (path: string) => {
			if (path.endsWith('pre.json')) return mockChangesetPreFile;
			return;
		},
	};
});

let packages: Partial<Project>[] = [];

vi.doMock('@pnpm/workspace.find-packages', () => ({
	findWorkspacePackagesNoCheck: () => packages,
}));

beforeEach(() => {
	vi.unstubAllEnvs();
	packages = [];
});

const generatePackage = (name: string, version: string, opts?: Record<string, any>): Partial<Project> => ({
	rootDir: (opts?.['bumped'] !== false ? 'mock' : 'nomock') as Project['rootDir'],
	manifest: {
		name,
		version,
		...opts?.['additional'],
	},
	writeProjectManifest: vi.fn(),
});

// @ts-ignore
const { processPackages } = await import('./process-packages.js');

test('should return main version and package versions', async () => {
	packages = [generatePackage('main', '1.0.0'), generatePackage('example', '1.1.0')];

	const { mainVersion, isPrerelease, packageVersions } = await processPackages();

	expect(mainVersion).toEqual('1.0.0');
	expect(isPrerelease).toEqual(false);
	expect(packageVersions).toEqual([{ name: 'example', version: '1.1.0' }]);
});

test('should fail if main version is missing', async () => {
	expect(() => processPackages()).rejects.toThrow(/Main version .* is missing or invalid/);
});

test('should respect manually defined version', async () => {
	packages = [generatePackage('main', '1.0.0'), generatePackage('example', '1.1.0')];

	vi.stubEnv('DIRECTUS_VERSION', '2.0.0');

	const { mainVersion, packageVersions } = await processPackages();

	expect(mainVersion).toEqual('2.0.0');
	expect(packageVersions).toEqual([{ name: 'example', version: '1.1.0' }]);
});

test('should fail with manually defined version when not in prerelease mode', async () => {
	vi.stubEnv('DIRECTUS_VERSION', '2.0.0-beta.0');

	expect(() => processPackages()).rejects.toThrow(
		`Main version is a prerelease but changesets isn't in prerelease mode`,
	);
});

test('should work with manually defined version when in prerelease mode', async () => {
	mockChangesetPreFile = JSON.stringify({ tag: 'beta' });
	vi.stubEnv('DIRECTUS_VERSION', '2.0.0-beta.0');

	const { mainVersion, isPrerelease, prereleaseId } = await processPackages();

	expect(mainVersion).toEqual('2.0.0-beta.0');
	expect(isPrerelease).toEqual(true);
	expect(prereleaseId).toEqual('beta');
});

test('should pass in prerelease mode', async () => {
	mockChangesetPreFile = JSON.stringify({ tag: 'beta' });
	packages = [generatePackage('main', '1.0.0-beta.0')];

	const { mainVersion, isPrerelease, prereleaseId } = await processPackages();

	expect(mainVersion).toEqual('1.0.0-beta.0');
	expect(isPrerelease).toEqual(true);
	expect(prereleaseId).toEqual('beta');
});

test('should return correct version for linked packages', async () => {
	packages = [
		generatePackage('main', '1.0.0'),
		generatePackage('trigger', '2.0.0'),
		generatePackage('target', '1.1.0', { bumped: false }),
	];

	const { packageVersions } = await processPackages();

	expect(packageVersions).toEqual(expect.arrayContaining([{ name: 'target', version: '1.1.1' }]));
});

test('should return correct version for linked packages in prerelease mode', async () => {
	mockChangesetPreFile = JSON.stringify({ tag: 'beta' });

	packages = [
		generatePackage('main', '1.0.0-beta.0'),
		generatePackage('trigger', '2.0.0-beta.0'),
		generatePackage('target', '1.1.0', { bumped: false }),
	];

	const { packageVersions } = await processPackages();

	expect(packageVersions).toEqual(expect.arrayContaining([{ name: 'target', version: '1.1.1-beta.0' }]));
});

test('should return correct version for linked packages in prerelease mode with existing prerelease version', async () => {
	mockChangesetPreFile = JSON.stringify({ tag: 'beta' });

	packages = [
		generatePackage('main', '1.0.0-beta.0'),
		generatePackage('trigger', '2.0.0-beta.0'),
		generatePackage('target', '1.1.1-beta.0', { bumped: false }),
	];

	const { packageVersions } = await processPackages();

	expect(packageVersions).toEqual(expect.arrayContaining([{ name: 'target', version: '1.1.1-beta.1' }]));
});

test('should fix version for private packages', async () => {
	mockChangesetPreFile = JSON.stringify({ tag: 'beta' });

	const privatePackage = generatePackage('private', '0.0.1', { additional: { private: true } });

	packages = [generatePackage('main', '1.0.0'), privatePackage];

	await processPackages();

	expect(privatePackage.writeProjectManifest).toHaveBeenCalledWith(expect.objectContaining({ version: '0.0.0' }));
});
