import { describe, expect, it } from 'vitest';
import { analyzeTemplate, extractVersion, matchesTemplate, replaceVersion, type VersionPlacement } from './version-url';

describe('analyzeTemplate', () => {
	it('detects query param placement', () => {
		expect(analyzeTemplate('https://example.com/posts/23?version={{$version}}')).toEqual({
			type: 'query',
			paramName: 'version',
		});
	});

	it('detects query param with spaces in template', () => {
		expect(analyzeTemplate('https://example.com/?v={{ $version }}')).toEqual({
			type: 'query',
			paramName: 'v',
		});
	});

	it('detects path segment placement', () => {
		expect(analyzeTemplate('https://example.com/{{$version}}/posts/23')).toEqual({
			type: 'path',
			segmentIndex: 1,
		});
	});

	it('detects subdomain placement', () => {
		expect(analyzeTemplate('https://{{$version}}.example.com/posts/23')).toEqual({
			type: 'subdomain',
			labelIndex: 0,
		});
	});

	it('detects hash placement', () => {
		expect(analyzeTemplate('https://example.com/#{{$version}}')).toEqual({
			type: 'hash',
			segmentIndex: 0,
		});
	});

	it('detects hash placement with multiple segments', () => {
		expect(analyzeTemplate('https://example.com/#/v/{{$version}}/posts')).toEqual({
			type: 'hash',
			segmentIndex: 1,
		});
	});

	it('returns null for no template', () => {
		expect(analyzeTemplate('https://example.com/posts')).toBeNull();
	});

	it('returns null for invalid URL', () => {
		expect(analyzeTemplate('not-a-url')).toBeNull();
	});
});

describe('extractVersion', () => {
	it('extracts from query param', () => {
		const placement: VersionPlacement = { type: 'query', paramName: 'version' };
		expect(extractVersion('https://example.com/posts/23?version=draft', placement)).toBe('draft');
	});

	it('extracts from path segment', () => {
		const placement: VersionPlacement = { type: 'path', segmentIndex: 1 };
		expect(extractVersion('https://example.com/draft/posts/23', placement)).toBe('draft');
	});

	it('extracts from subdomain', () => {
		const placement: VersionPlacement = { type: 'subdomain', labelIndex: 0 };
		expect(extractVersion('https://draft.example.com/posts/23', placement)).toBe('draft');
	});

	it('extracts from hash', () => {
		const placement: VersionPlacement = { type: 'hash', segmentIndex: 0 };
		expect(extractVersion('https://example.com/#draft', placement)).toBe('draft');
	});

	it('extracts from hash with multiple segments', () => {
		const placement: VersionPlacement = { type: 'hash', segmentIndex: 1 };
		expect(extractVersion('https://example.com/#/v/draft/posts', placement)).toBe('draft');
	});

	it('returns null for null placement', () => {
		expect(extractVersion('https://example.com/', null)).toBeNull();
	});

	it('returns null for invalid URL', () => {
		const placement: VersionPlacement = { type: 'query', paramName: 'v' };
		expect(extractVersion('not-a-url', placement)).toBeNull();
	});
});

describe('replaceVersion', () => {
	it('replaces query param', () => {
		const placement: VersionPlacement = { type: 'query', paramName: 'version' };

		expect(replaceVersion('https://example.com/posts/23?version=main', placement, 'draft')).toBe(
			'https://example.com/posts/23?version=draft',
		);
	});

	it('replaces path segment', () => {
		const placement: VersionPlacement = { type: 'path', segmentIndex: 1 };

		expect(replaceVersion('https://example.com/main/posts/23', placement, 'draft')).toBe(
			'https://example.com/draft/posts/23',
		);
	});

	it('replaces subdomain', () => {
		const placement: VersionPlacement = { type: 'subdomain', labelIndex: 0 };

		expect(replaceVersion('https://main.example.com/posts/23', placement, 'draft')).toBe(
			'https://draft.example.com/posts/23',
		);
	});

	it('replaces hash segment', () => {
		const placement: VersionPlacement = { type: 'hash', segmentIndex: 0 };

		expect(replaceVersion('https://example.com/#main', placement, 'draft')).toBe('https://example.com/#draft');
	});

	it('replaces hash segment from multiple segments', () => {
		const placement: VersionPlacement = { type: 'hash', segmentIndex: 1 };

		expect(replaceVersion('https://example.com/#/v/main/posts', placement, 'draft')).toBe(
			'https://example.com/#/v/draft/posts',
		);
	});

	it('returns url unchanged for null placement', () => {
		expect(replaceVersion('https://example.com/', null, 'draft')).toBe('https://example.com/');
	});

	it('returns url unchanged for invalid URL', () => {
		const placement: VersionPlacement = { type: 'query', paramName: 'v' };
		expect(replaceVersion('not-a-url', placement, 'draft')).toBe('not-a-url');
	});
});

describe('matchesTemplate', () => {
	it('matches query param template regardless of path', () => {
		const placement: VersionPlacement = { type: 'query', paramName: 'version' };

		expect(
			matchesTemplate(
				'https://example.com/posts/23?version={{$version}}',
				'https://example.com/pages/1?version=draft',
				placement,
			),
		).toBe(true);
	});

	it('matches path template', () => {
		const placement: VersionPlacement = { type: 'path', segmentIndex: 1 };

		expect(
			matchesTemplate('https://example.com/{{$version}}/posts/23', 'https://example.com/draft/pages/1', placement),
		).toBe(true);
	});

	it('matches subdomain template with different version labels', () => {
		const placement: VersionPlacement = { type: 'subdomain', labelIndex: 0 };

		expect(
			matchesTemplate('https://{{$version}}.example.com/posts', 'https://draft.example.com/pages', placement),
		).toBe(true);
	});

	it('rejects subdomain template with different base domain', () => {
		const placement: VersionPlacement = { type: 'subdomain', labelIndex: 0 };

		expect(matchesTemplate('https://{{$version}}.example.com/posts', 'https://draft.other.com/pages', placement)).toBe(
			false,
		);
	});

	it('matches hash template', () => {
		const placement: VersionPlacement = { type: 'hash', segmentIndex: 0 };

		expect(matchesTemplate('https://example.com/#{{$version}}', 'https://example.com/#draft', placement)).toBe(true);
	});

	it('matches hash template with multiple segments', () => {
		const placement: VersionPlacement = { type: 'hash', segmentIndex: 0 };

		expect(
			matchesTemplate('https://example.com/#/v/{{$version}}/posts', 'https://example.com/#/v/draft/pages', placement),
		).toBe(true);
	});

	it('uses sameOrigin when placement is null (no template)', () => {
		expect(matchesTemplate('https://example.com/posts', 'https://example.com/other', null)).toBe(true);
	});

	it('rejects different origin for null placement', () => {
		expect(matchesTemplate('https://example.com/posts', 'https://other.com/posts', null)).toBe(false);
	});
});
