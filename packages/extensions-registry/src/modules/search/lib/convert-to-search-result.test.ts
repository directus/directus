import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getPackageExtensionType } from '../../../utils/get-package-extension-type.js';
import { convertToSearchResult } from './convert-to-search-result.js';

vi.mock('../utils/get-package-extension-type.js');

beforeEach(() => {
	vi.mocked(getPackageExtensionType).mockReturnValue('interface');
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Returns filter count based on registry total', () => {
	const res = convertToSearchResult({
		total: 15,
		objects: [],
	});

	const expected = {
		meta: {
			filter_count: 15,
		},
		data: [],
	};

	expect(res).toEqual(expected);
});

test('Formats objects', () => {
	const res = convertToSearchResult({
		total: 15,
		objects: [
			{
				package: {
					name: 'test-package',
					description: 'test-description',
					version: '1.0.0',
					keywords: ['directus-extension', 'directus-extension-interface'],
					author: {
						username: 'rijk',
					},
					publisher: {
						username: 'publisher',
					},
					maintainers: [
						{
							username: 'ben',
						},
					],
				},
			},
		],
	});

	const expected = {
		meta: {
			filter_count: 15,
		},
		data: [
			{
				name: 'test-package',
				description: 'test-description',
				version: '1.0.0',
				type: 'interface',
				author: 'rijk',
				maintainers: ['ben'],
			},
		],
	};

	expect(res).toEqual(expected);
});

test('Defaults to publisher if author username is unavailable', () => {
	const res = convertToSearchResult({
		total: 15,
		objects: [
			{
				package: {
					name: 'test-package',
					description: 'test-description',
					version: '1.0.0',
					keywords: ['directus-extension', 'directus-extension-interface'],
					author: {},
					publisher: {
						username: 'publisher',
					},
					maintainers: [
						{
							username: 'ben',
						},
					],
				},
			},
		],
	});

	const expected = {
		meta: {
			filter_count: 15,
		},
		data: [
			{
				name: 'test-package',
				description: 'test-description',
				version: '1.0.0',
				type: 'interface',
				author: 'publisher',
				maintainers: ['ben'],
			},
		],
	};

	expect(res).toEqual(expected);
});
