import type { RequestParameters } from 'maplibre-gl';
import { expect, test } from 'vitest';
import { getMapboxRequestTransformer, resolveMapboxUrl } from '@/utils/geometry/mapbox';

/**
 * maplibre types `transformRequest` as possibly async. Ours never is, so narrow away the promise
 * branch rather than threading `await` through every assertion.
 */
function transformerFor(accessToken: string) {
	return getMapboxRequestTransformer(accessToken) as (url: string) => RequestParameters | undefined;
}

test('Resolves style URLs', () => {
	expect(resolveMapboxUrl('mapbox://styles/directus/cktaiz31c509n18nrxj63zdy6')).toBe(
		'https://api.mapbox.com/styles/v1/directus/cktaiz31c509n18nrxj63zdy6',
	);
});

test('Resolves sprite URLs, preserving the suffix maplibre appends', () => {
	expect(resolveMapboxUrl('mapbox://sprites/directus/abc123.json')).toBe(
		'https://api.mapbox.com/styles/v1/directus/abc123/sprite.json',
	);

	expect(resolveMapboxUrl('mapbox://sprites/directus/abc123@2x.png')).toBe(
		'https://api.mapbox.com/styles/v1/directus/abc123/sprite@2x.png',
	);

	expect(resolveMapboxUrl('mapbox://sprites/directus/abc123')).toBe(
		'https://api.mapbox.com/styles/v1/directus/abc123/sprite',
	);
});

test('Resolves sprite URLs carrying a Studio version hash', () => {
	expect(resolveMapboxUrl('mapbox://sprites/directus/abc123/8mkq4ehzz5uwrnfmvpp1yjl2s@2x.png')).toBe(
		'https://api.mapbox.com/styles/v1/directus/abc123/8mkq4ehzz5uwrnfmvpp1yjl2s/sprite@2x.png',
	);

	expect(resolveMapboxUrl('mapbox://sprites/directus/abc123/8mkq4ehzz5uwrnfmvpp1yjl2s.json')).toBe(
		'https://api.mapbox.com/styles/v1/directus/abc123/8mkq4ehzz5uwrnfmvpp1yjl2s/sprite.json',
	);

	expect(resolveMapboxUrl('mapbox://sprites/directus/abc123/8mkq4ehzz5uwrnfmvpp1yjl2s')).toBe(
		'https://api.mapbox.com/styles/v1/directus/abc123/8mkq4ehzz5uwrnfmvpp1yjl2s/sprite',
	);
});

test('Resolves font URLs without re-encoding the fontstack', () => {
	expect(resolveMapboxUrl('mapbox://fonts/directus/Arial%20Unicode%20MS%20Regular/0-255.pbf')).toBe(
		'https://api.mapbox.com/fonts/v1/directus/Arial%20Unicode%20MS%20Regular/0-255.pbf',
	);
});

test('Resolves tile URLs', () => {
	expect(resolveMapboxUrl('mapbox://tiles/mapbox.satellite/1/2/3@2x.webp')).toBe(
		'https://api.mapbox.com/v4/mapbox.satellite/1/2/3@2x.webp',
	);
});

test('Treats a bare tileset id as a TileJSON reference', () => {
	expect(resolveMapboxUrl('mapbox://mapbox.mapbox-streets-v8')).toBe(
		'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8.json?secure',
	);

	expect(resolveMapboxUrl('mapbox://mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2')).toBe(
		'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json?secure',
	);
});

test('Refuses to guess at an unrecognised multi-segment mapbox:// form', () => {
	// Falling through to the tileset shape here would yield a well-formed URL that merely 404s,
	// which is far harder to trace than a URL that visibly never got rewritten.
	expect(resolveMapboxUrl('mapbox://something/we/do/not/handle')).toBeNull();
});

test('Ignores URLs that are not mapbox://', () => {
	expect(resolveMapboxUrl('https://tile.openstreetmap.org/1/2/3.png')).toBeNull();
});

test('Tokenises resolved URLs, respecting an existing query string', () => {
	const transform = transformerFor('pk.test');

	expect(transform('mapbox://styles/directus/abc123')?.url).toBe(
		'https://api.mapbox.com/styles/v1/directus/abc123?access_token=pk.test',
	);

	expect(transform('mapbox://mapbox.satellite')?.url).toBe(
		'https://api.mapbox.com/v4/mapbox.satellite.json?secure&access_token=pk.test',
	);
});

test('Tokenises plain Mapbox API URLs, such as tiles listed in a TileJSON response', () => {
	const transform = transformerFor('pk.test');

	expect(transform('https://api.mapbox.com/v4/mapbox.satellite/1/2/3.webp')?.url).toBe(
		'https://api.mapbox.com/v4/mapbox.satellite/1/2/3.webp?access_token=pk.test',
	);
});

test('Does not append a second access token', () => {
	const transform = transformerFor('pk.test');

	expect(transform('https://api.mapbox.com/v4/mapbox.satellite.json?access_token=pk.existing')?.url).toBe(
		'https://api.mapbox.com/v4/mapbox.satellite.json?access_token=pk.existing',
	);
});

test('Leaves non-Mapbox requests untouched so the token never leaks to another host', () => {
	const transform = transformerFor('pk.test');

	expect(transform('https://tile.openstreetmap.org/1/2/3.png')).toBeUndefined();
	expect(transform('https://fonts.openmaptiles.org/Open%20Sans/0-255.pbf')).toBeUndefined();
});
