import { customAlphabet } from 'nanoid';

const generateID = customAlphabet('abcdefghijklmnopqrstuvxyz', 5);

/**
 * Generate an index name for a given collection + fields combination.
 *
 * Is based on the default index name generation of knex, but limits the index to a maximum of 64
 * characters (the max length for MySQL and MariaDB).
 *
 * @see
 * https://github.com/knex/knex/blob/fff6eb15d7088d4198650a2c6e673dedaf3b8f36/lib/schema/tablecompiler.js#L282-L297
 */
export function getDefaultIndexName(
	type: 'unique' | 'foreign' | 'index',
	collection: string,
	fields: string | string[]
): string {
	if (!Array.isArray(fields)) fields = fields ? [fields] : [];
	const table = collection.replace(/\.|-/g, '_');
	const indexName = (table + '_' + fields.join('_') + '_' + type).toLowerCase();

	if (indexName.length <= 64) return indexName;

	const suffix = `__${generateID()}_${type}`;
	const prefix = indexName.substring(0, 64 - suffix.length);

	return `${prefix}__${generateID()}_${type}`;
}
