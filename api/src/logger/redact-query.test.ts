import { redactQuery } from './redact-query.js';
import { REDACTED_TEXT } from '@directus/utils';
import { expect, test } from 'vitest';

test('Redacts `access_token` query param', () => {
	const url = '/items/test?access_token=d1r3ctu5';

	const redactedUrl = redactQuery(url);

	expect(redactedUrl).toBe('/items/test?access_token=' + REDACTED_TEXT);
});

test('Returns original string if invalid URL is passed', () => {
	const url = '//';
	const redactedUrl = redactQuery(url);
	expect(redactedUrl).toBe(url);
});
