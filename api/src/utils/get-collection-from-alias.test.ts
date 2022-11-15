import { getCollectionFromAlias } from './get-collection-from-alias';
import { AliasMap } from './get-column-path';
import { expect, it } from 'vitest';

it('Returns the correct collection', () => {
	const aliasMap: AliasMap = {
		author: { alias: 'aaaaa', collection: 'directus_users' },
		'author.role': { alias: 'bbbbb', collection: 'directus_roles' },
		'author.role.org': { alias: 'ccccc', collection: 'organisation' },
		'author.role.org.admin': { alias: 'ddddd', collection: 'directus_users' },
	};

	const collection = getCollectionFromAlias('ccccc', aliasMap);
	expect(collection).toBe('organisation');
});

it('Returns undefined if alias does not exist', () => {
	const aliasMap: AliasMap = {};

	const collection = getCollectionFromAlias('abcde', aliasMap);
	expect(collection).toBeUndefined();
});
