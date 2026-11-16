import { describe, expect, test } from 'vitest';
import {
	getLinkTableName,
	getShadowTableName,
	getVersionReferenceField,
	isReservedVersionField,
	isShadowTable,
	MAX_IDENTIFIER_LENGTH,
} from './constants.js';

describe('version table names', () => {
	test('prefixes short names', () => {
		expect(getShadowTableName('articles')).toBe('directus_shadow_articles');
		expect(getLinkTableName('articles')).toBe('directus_link_articles');
		expect(getVersionReferenceField('author')).toBe('version_ref_author');
	});

	test('shortens names exceeding the identifier length limit with a hash, keeping them unique', () => {
		const a = getLinkTableName('endpoints_query_version_item_articles_tags_junction');
		const b = getLinkTableName('endpoints_query_version_item_articles_tags_junction_2');

		expect(a.length).toBeLessThanOrEqual(MAX_IDENTIFIER_LENGTH);
		expect(b.length).toBeLessThanOrEqual(MAX_IDENTIFIER_LENGTH);
		expect(a).not.toBe(b);
		expect(isShadowTable(a)).toBe(true);
		expect(getLinkTableName('endpoints_query_version_item_articles_tags_junction')).toBe(a);

		expect(getVersionReferenceField('f'.repeat(64)).length).toBeLessThanOrEqual(MAX_IDENTIFIER_LENGTH);
	});
});

describe('isReservedVersionField', () => {
	test('reserves the version meta fields and the version reference prefix', () => {
		expect(isReservedVersionField('version_type')).toBe(true);
		expect(isReservedVersionField('version_id')).toBe(true);
		expect(isReservedVersionField('version_ref_author')).toBe(true);
		expect(isReservedVersionField(getVersionReferenceField('f'.repeat(64)))).toBe(true);
	});

	test('allows other field names', () => {
		expect(isReservedVersionField('version')).toBe(false);
		expect(isReservedVersionField('version_number')).toBe(false);
		expect(isReservedVersionField('title')).toBe(false);
	});
});
