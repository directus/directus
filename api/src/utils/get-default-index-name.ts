import { getSimpleHash } from '@directus/utils';

export type GetDefaultIndexNameOptions = {
	maxLength?: number;
};

/**
 * Generate an index name for a given collection + fields combination.
 *
 * Based on the default index name generation of knex, with the caveat that it limits the index to options.maxLength
 * which defaults to 60 characters.
 *
 * @see
 * https://github.com/knex/knex/blob/fff6eb15d7088d4198650a2c6e673dedaf3b8f36/lib/schema/tablecompiler.js#L282-L297
 */
export function getDefaultIndexName(
	type: 'unique' | 'foreign' | 'index',
	collection: string,
	fields: string | string[],
	options?: GetDefaultIndexNameOptions,
): string {
	const maxLength = options?.maxLength ?? 60;
	if (!Array.isArray(fields)) fields = fields ? [fields] : [];
	const table = collection.replace(/\.|-/g, '_');
	const indexName = (table + '_' + fields.join('_') + '_' + type).toLowerCase();

	if (indexName.length <= maxLength) return indexName;

	const suffix = `__${getSimpleHash(indexName)}_${type}`;
	const prefix = indexName.substring(0, maxLength - suffix.length);

	return `${prefix}${suffix}`;
}
