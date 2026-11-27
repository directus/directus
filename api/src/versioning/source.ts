import type { CollectionOverview, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getHelpers } from '../database/helpers/index.js';
import { getDatabaseClient } from '../database/index.js';
import { VERSION_SYSTEM_FIELDS, VERSIONED_KEY_FIELD } from '../services/version-tables/constants.js';

const ROWS_ALIAS = 'directus_versioned_rows';

/**
 * Rows of the versioned read collection: the live items, with the system fields of their published version and their
 * version references, followed by their unpublished versions from the shadow table.
 */
export function getVersionedSource(knex: Knex, schema: SchemaOverview, collection: string): Knex.QueryBuilder {
	const { collection: read, shadow, link, referenceFields, a2oReferences } = schema.versioning![collection]!;
	const live = schema.collections[collection]!;
	const { primary } = live;
	const isNumericKey = read.fields[VERSIONED_KEY_FIELD]!.type !== 'string';
	const systemFields: string[] = Object.values(VERSION_SYSTEM_FIELDS);

	const columns = Object.values(live.fields)
		.filter((field) => !field.alias)
		.map((field) => field.field);

	/** Selects `alias.field`, or NULL if the table doesn't have that field */
	function column(alias: string, table: CollectionOverview | null, field: string) {
		if (table && field in table.fields) {
			return knex.ref(`${alias}.${field}`).as(field);
		}

		return knex.raw('NULL as ??', [field]);
	}

	/** Selects the given expression as the versioned key, cast to string for non-numeric keys */
	function key(sql: string, binding: string) {
		let expression = sql;

		if (!isNumericKey) {
			expression = getHelpers(knex).schema.castToString(sql);
		}

		return knex.raw(`${expression} as ??`, [binding, VERSIONED_KEY_FIELD]);
	}

	const rows = knex
		.select([
			...columns.map((field) => column(collection, live, field)),
			...systemFields.map((field) =>
				field === VERSION_SYSTEM_FIELDS.type
					? knex.raw(`'published' as ??`, [field])
					: column('published', shadow, field),
			),
			...referenceFields.map((field) => column(link?.collection ?? '', link, field)),
			key('??', `${collection}.${primary}`),
		])
		.from(collection);

	if (shadow) {
		rows.leftJoin({ published: shadow.collection }, function () {
			this.on(`published.${primary}`, '=', `${collection}.${primary}`).andOnVal(
				`published.${VERSION_SYSTEM_FIELDS.type}`,
				'=',
				'published',
			);
		});
	}

	if (link) {
		rows.leftJoin(link.collection, `${link.collection}.${primary}`, `${collection}.${primary}`);
	}

	if (shadow) {
		const table = shadow.collection;
		// MySQL version ids are unsigned, so they need to be signed before they can be negated
		const negatedId = getDatabaseClient(knex) === 'mysql' ? '-1 * CAST(?? AS SIGNED)' : '-1 * ??';

		// Versions use their negative id as key so o2m relations of live rows still work; published versions are the live row
		rows.unionAll([
			knex
				.select([
					...[...columns, ...systemFields, ...referenceFields].map((field) => column(table, shadow, field)),
					key(negatedId, `${table}.${VERSION_SYSTEM_FIELDS.id}`),
				])
				.from(table)
				.whereNot(`${table}.${VERSION_SYSTEM_FIELDS.type}`, 'published'),
		]);
	}

	if (a2oReferences.length === 0) return rows;

	return knex
		.select([
			`${ROWS_ALIAS}.*`,
			...a2oReferences.map(({ column, reference, collectionField, collection }) =>
				knex.raw('case when ?? = ? then ?? end as ??', [
					`${ROWS_ALIAS}.${collectionField}`,
					collection,
					`${ROWS_ALIAS}.${reference}`,
					column,
				]),
			),
		])
		.from(rows.as(ROWS_ALIAS));
}
