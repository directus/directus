import { describe, expect, test } from 'vitest';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { getRouteVersionContext } from './get-route-version-context';

describe('getRouteVersionContext', () => {
	test('extracts version route state', () => {
		expect(
			getRouteVersionContext(
				route({
					path: '/content/posts/1',
					params: { collection: 'posts', primaryKey: '1' },
					query: { version: 'draft', versionId: 'version-1' },
				}),
			),
		).toEqual({
			versionKey: 'draft',
			versionId: 'version-1',
			isVersionContext: true,
			isItemlessDraft: false,
		});
	});

	test('detects itemless draft routes', () => {
		expect(
			getRouteVersionContext(
				route({
					path: '/content/posts/+',
					params: { collection: 'posts', primaryKey: '+' },
					query: { version: 'draft', versionId: 'version-1' },
				}),
			).isItemlessDraft,
		).toBe(true);
	});

	test('uses the first version query value', () => {
		expect(
			getRouteVersionContext(
				route({
					path: '/content/posts/1',
					params: { collection: 'posts', primaryKey: '1' },
					query: { version: ['draft'] },
				}),
			),
		).toEqual({
			versionKey: 'draft',
			versionId: undefined,
			isVersionContext: true,
			isItemlessDraft: false,
		});
	});
});

function route(overrides: Partial<RouteLocationNormalizedLoaded>) {
	return {
		path: '',
		params: {},
		query: {},
		...overrides,
	} as RouteLocationNormalizedLoaded;
}
