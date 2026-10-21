import { describe, expect, test } from 'vitest';
import { parseRequestUrl } from './parse-request-url.js';

describe('parseRequestUrl', () => {
	test('returns the pathname of a path without query', () => {
		expect(parseRequestUrl('/items/articles')).toEqual({ pathname: '/items/articles', query: null });
	});

	test('splits off the query string', () => {
		expect(parseRequestUrl('/items/articles?fields=id&limit=1')).toEqual({
			pathname: '/items/articles',
			query: 'fields=id&limit=1',
		});
	});

	test('returns an empty query for a trailing question mark', () => {
		expect(parseRequestUrl('/items/articles?')).toEqual({ pathname: '/items/articles', query: '' });
	});

	test('keeps question marks after the first one in the query', () => {
		expect(parseRequestUrl('/items/articles?filter=a?b')).toEqual({ pathname: '/items/articles', query: 'filter=a?b' });
	});

	test('drops the fragment', () => {
		expect(parseRequestUrl('/items/articles?limit=1#top')).toEqual({ pathname: '/items/articles', query: 'limit=1' });
		expect(parseRequestUrl('/items/articles#top?limit=1')).toEqual({ pathname: '/items/articles', query: null });
	});

	test('drops the origin of absolute-form request targets', () => {
		expect(parseRequestUrl('http://example.com/graphql?query=x')).toEqual({ pathname: '/graphql', query: 'query=x' });

		expect(parseRequestUrl('HTTPS://user@example.com:8055/server/ping')).toEqual({
			pathname: '/server/ping',
			query: null,
		});
	});

	test('returns the root pathname for an absolute-form target without path', () => {
		expect(parseRequestUrl('http://example.com')).toEqual({ pathname: '/', query: null });
		expect(parseRequestUrl('http://example.com?a=1')).toEqual({ pathname: '/', query: 'a=1' });
	});

	test.each(['//example.com/items/articles', '/items/../server/info', '/items/%2e%2e/server/info', '/items/a\\b'])(
		'does not normalize "%s"',
		(requestUrl) => {
			expect(parseRequestUrl(requestUrl)).toEqual({ pathname: requestUrl, query: null });
		},
	);

	test('does not throw on malformed input', () => {
		expect(parseRequestUrl('/items/%zz?%%')).toEqual({ pathname: '/items/%zz', query: '%%' });
		expect(parseRequestUrl('http://[/items')).toEqual({ pathname: '/items', query: null });
	});
});
