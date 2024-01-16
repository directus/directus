import { afterEach, expect, test, vi } from 'vitest';
import { getPackageExtensionType } from '../../../utils/get-package-extension-type.js';
import type { RegistryDescribeResponse } from '../schemas/registry-describe-response.js';
import { getRepositoryUrl } from '../utils/get-repository-url.js';
import { convertToDescribeResult } from './convert-to-describe-result.js';

vi.mock('../utils/get-repository-url.js');
vi.mock('../../../utils/get-package-extension-type.js');

afterEach(() => {
	vi.resetAllMocks();
});

test('Throws error if latest version cannot be extracted', () => {
	const registryResponse = {
		name: 'test-pkg',
		versions: {},
		'dist-tags': {
			latest: 'x',
		},
	} as unknown as RegistryDescribeResponse;

	expect(() => convertToDescribeResult(registryResponse)).toThrowErrorMatchingInlineSnapshot(
		`[DirectusError: Can't process content. Could not find package information for version "x".]`,
	);
});

test('Throws error if latest version cannot be extracted', () => {
	const registryResponse = {
		name: 'test-pkg',
		versions: {
			x: {},
		},
		'dist-tags': {
			latest: 'x',
		},
	} as unknown as RegistryDescribeResponse;

	expect(() => convertToDescribeResult(registryResponse)).toThrowErrorMatchingInlineSnapshot(
		`[DirectusError: Can't process content. Extension "test-pkg" does not contain a Directus Extensions Manifest.]`,
	);
});

test('Returns basic conversion from passed data', () => {
	vi.mocked(getPackageExtensionType).mockReturnValue('interface');
	vi.mocked(getRepositoryUrl).mockReturnValue('https://github.com/directus/example');

	const registryResponse = {
		name: 'test-pkg',
		description: 'test-description',
		keywords: ['test-keywords'],
		maintainers: [{ name: 'test-maintainer' }],
		versions: {
			x: {
				_npmUser: { name: 'test-publisher' },
				dist: {
					fileCount: 5,
					unpackedSize: 1500,
					tarball: 'test-tarball',
				},
				'directus:extension': {
					host: '^10.0.0',
				},
			},
		},
		homepage: 'test-homepage',
		bugs: {
			url: 'test-bugs-url',
		},
		repository: {
			type: 'git',
			url: 'git+https://github.com/directus/test',
		},
		readme: 'test-readme',
		license: 'BUSL',
		'dist-tags': {
			latest: 'x',
		},
	} as unknown as RegistryDescribeResponse;

	const expectedOutput = {
		data: {
			name: 'test-pkg',
			description: 'test-description',
			version: 'x',
			type: 'interface',
			publisher: 'test-publisher',
			maintainers: ['test-maintainer'],
			readme: 'test-readme',
			versions: ['x'],
			fileCount: 5,
			size: 1500,
			host: '^10.0.0',
			homepage: 'test-homepage',
			bugs: 'test-bugs-url',
			license: 'BUSL',
			repository: 'https://github.com/directus/example',
			tarball: 'test-tarball',
			sandbox: null,
		},
	};

	expect(convertToDescribeResult(registryResponse)).toEqual(expectedOutput);
});

test('Defaults homepage to null', () => {
	const registryResponse = {
		name: 'test-pkg',
		versions: {
			x: {
				_npmUser: {},
				'directus:extension': {},
				dist: {},
			},
		},
		'dist-tags': {
			latest: 'x',
		},
		maintainers: [],
	} as unknown as RegistryDescribeResponse;

	const res = convertToDescribeResult(registryResponse);

	expect(res.data.homepage).toBe(null);
});

test('Defaults bugs URL to null', () => {
	const registryResponse = {
		name: 'test-pkg',
		versions: {
			x: {
				_npmUser: {},
				'directus:extension': {},
				dist: {},
			},
		},
		'dist-tags': {
			latest: 'x',
		},
		maintainers: [],
		bugs: null,
	} as unknown as RegistryDescribeResponse;

	const res = convertToDescribeResult(registryResponse);

	expect(res.data.homepage).toBe(null);

	registryResponse.bugs = { url: undefined };

	const res2 = convertToDescribeResult(registryResponse);

	expect(res2.data.homepage).toBe(null);
});

test('Defaults repository to null', () => {
	const registryResponse = {
		name: 'test-pkg',
		versions: {
			x: {
				_npmUser: {},
				'directus:extension': {},
				dist: {},
			},
		},
		'dist-tags': {
			latest: 'x',
		},
		maintainers: [],
	} as unknown as RegistryDescribeResponse;

	const res = convertToDescribeResult(registryResponse);

	expect(res.data.repository).toBe(null);
});

test('Returns sandbox from response as-is', () => {
	const sandbox = { enabled: true };

	const registryResponse = {
		name: 'test-pkg',
		versions: {
			x: {
				_npmUser: {},
				'directus:extension': {
					sandbox: sandbox,
				},
				dist: {},
			},
		},
		'dist-tags': {
			latest: 'x',
		},
		maintainers: [],
	} as unknown as RegistryDescribeResponse;

	const res = convertToDescribeResult(registryResponse);

	expect(res.data.sandbox).toBe(sandbox);
});
