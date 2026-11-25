import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getHelpers } from '../database/helpers/index.js';
import { getDatabaseClient } from '../database/index.js';
import {
	VERSION_REFERENCE_PREFIX,
	VERSION_SYSTEM_FIELDS,
	VERSIONED_KEY_FIELD,
} from '../services/version-tables/constants.js';
import { getVersionedRead } from './schema.js';

/**
 * Rows of the collection that reads the live items of a collection together with their versions. Collections that
 * aren't versioned only have live rows, with the system fields of published items and the references to versions from
 * their link table.
 */
export function getVersionedSource(knex: Knex, schema: SchemaOverview, collection: string): Knex.QueryBuilder {
	const read = getVersionedRead(knex, schema, collection);
	const live = schema.collections[collection]!;
	const { primary } = live;
	const shadowTable = read.shadow;
	const shadow = shadowTable ? read.schema.collections[shadowTable] : undefined;
	const linkTable = read.link;
	const link = linkTable ? read.schema.collections[linkTable] : undefined;

	const columns = Object.values(live.fields)
		.filter((field) => !field.alias)
		.map((field) => field.field);

	const systemFields: string[] = Object.values(VERSION_SYSTEM_FIELDS);
	const referenceFields = read.versionFields.filter((field) => !systemFields.includes(field));
	const linkedFields = link ? Object.keys(link.fields).filter((field) => field !== primary) : [];
	const isNumericKey = ['integer', 'bigInteger'].includes(live.fields[primary]?.type ?? '');

	// Live rows keep their primary key as key, versions use their negative id, so o2m relations of live rows still work.
	// MySQL version ids are unsigned, so they need to be signed before they can be negated.
	const negatedVersionId = getDatabaseClient(knex) === 'mysql' ? '-1 * CAST(?? AS SIGNED)' : '-1 * ??';

	const selectKey = (sql: string, bindings: string[]) =>
		isNumericKey
			? knex.raw(`${sql} as ??`, [...bindings, VERSIONED_KEY_FIELD])
			: knex.raw(`${getHelpers(knex).schema.castToString(sql)} as ??`, [...bindings, VERSIONED_KEY_FIELD]);

	const selectColumn = (table: string | null, exists: boolean, column: string, alias = column) =>
		table && exists ? knex.ref(`${table}.${column}`).as(alias) : knex.raw('NULL as ??', [alias]);

	const itemsQuery = knex
		.select([
			...columns.map((column) => selectColumn(collection, true, column)),
			...systemFields.map((column) =>
				column === VERSION_SYSTEM_FIELDS.type
					? knex.raw(`'published' as ??`, [column])
					: selectColumn('published', Boolean(shadow), column),
			),
			...referenceFields.map((column) => {
				const field = column.slice(VERSION_REFERENCE_PREFIX.length);
				return selectColumn(linkTable, linkedFields.includes(field), field, column);
			}),
			selectKey('??', [`${collection}.${primary}`]),
		])
		.from(collection);

	if (shadowTable) {
		itemsQuery.leftJoin({ published: shadowTable }, function () {
			this.on(`published.${primary}`, '=', `${collection}.${primary}`).andOnVal(
				`published.${VERSION_SYSTEM_FIELDS.type}`,
				'=',
				'published',
			);
		});
	}

	if (linkTable) {
		itemsQuery.leftJoin(linkTable, `${linkTable}.${primary}`, `${collection}.${primary}`);
	}

	if (!shadowTable || !shadow) return itemsQuery;

	// Published versions are represented by the live item
	const versionsQuery = knex
		.select([
			...columns.map((column) => selectColumn(shadowTable, column in shadow.fields, column)),
			...systemFields.map((column) => selectColumn(shadowTable, true, column)),
			...referenceFields.map((column) => selectColumn(shadowTable, column in shadow.fields, column)),
			selectKey(negatedVersionId, [`${shadowTable}.${VERSION_SYSTEM_FIELDS.id}`]),
		])
		.from(shadowTable)
		.whereNot(`${shadowTable}.${VERSION_SYSTEM_FIELDS.type}`, 'published');

	return itemsQuery.unionAll([versionsQuery]);
}
