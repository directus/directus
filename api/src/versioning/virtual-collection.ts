import type { FieldOverview, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { uniq } from 'lodash-es';
import { getHelpers } from '../database/helpers/index.js';
import { getDatabaseClient } from '../database/index.js';
import { VERSION_REFERENCE_PREFIX, VERSION_SYSTEM_FIELDS } from '../services/version-tables/constants.js';
import type { VersionReadMode } from '../types/ast.js';

/** Unique key of the combined rows, as live primary keys and version ids overlap */
const KEY_FIELD = 'directus_version_key';

/**
 * A collection that reads from the combined live and version rows. It has its own name and primary key,
 * as the live primary key isn't unique across those rows.
 */
export function createVirtualCollection(knex: Knex, schema: SchemaOverview, collection: string, mode: VersionReadMode) {
	const name = `directus_versioned_${collection}`;
	const live = schema.collections[collection]!;
	const { primary } = live;
	const { versioning } = getHelpers(knex);
	const shadowTable = versioning.getShadowTableName(collection);
	const shadow = schema.collections[shadowTable]!;
	const linkTable = versioning.getLinkTableName(collection);
	const link = schema.collections[linkTable];

	const columns = Object.values(live.fields)
		.filter((field) => !field.alias)
		.map((field) => field.field);

	const systemFields: string[] = Object.values(VERSION_SYSTEM_FIELDS);
	const linkedFields = link ? Object.keys(link.fields).filter((field) => field !== primary) : [];

	const referenceFields = uniq([
		...Object.keys(shadow.fields).filter((field) => field.startsWith(VERSION_REFERENCE_PREFIX)),
		...linkedFields.map((field) => versioning.getVersionReferenceField(field)),
	]);

	const isNumericKey = ['integer', 'bigInteger'].includes(live.fields[primary]!.type);

	// Live rows keep their primary key as key, versions use their negative id, so o2m relations of live rows still work.
	// MySQL version ids are unsigned, so they need to be signed before they can be negated.
	const negatedVersionId = getDatabaseClient(knex) === 'mysql' ? '-1 * CAST(?? AS SIGNED)' : '-1 * ??';

	const selectKey = (sql: string, bindings: string[]) =>
		isNumericKey
			? knex.raw(`${sql} as ??`, [...bindings, KEY_FIELD])
			: knex.raw(`${getHelpers(knex).schema.castToString(sql)} as ??`, [...bindings, KEY_FIELD]);

	const selectColumn = (table: string, exists: boolean, column: string, alias = column) =>
		exists ? knex.ref(`${table}.${column}`).as(alias) : knex.raw('NULL as ??', [alias]);

	const versionsQuery = knex
		.select([
			...columns.map((column) => selectColumn(shadowTable, column in shadow.fields, column)),
			...systemFields.map((column) => selectColumn(shadowTable, true, column)),
			...referenceFields.map((column) => selectColumn(shadowTable, column in shadow.fields, column)),
			selectKey(negatedVersionId, [`${shadowTable}.${VERSION_SYSTEM_FIELDS.id}`]),
		])
		.from(shadowTable);

	let source = versionsQuery;

	if (mode === 'items') {
		// Published versions are represented by the live item
		versionsQuery.whereNot(`${shadowTable}.${VERSION_SYSTEM_FIELDS.type}`, 'published');

		const itemsQuery = knex
			.select([
				...columns.map((column) => selectColumn(collection, true, column)),
				...systemFields.map((column) =>
					column === VERSION_SYSTEM_FIELDS.type
						? knex.raw(`'published' as ??`, [column])
						: selectColumn('published', true, column),
				),
				...referenceFields.map((column) => {
					const field = column.slice(VERSION_REFERENCE_PREFIX.length);
					return selectColumn(linkTable, linkedFields.includes(field), field, column);
				}),
				selectKey('??', [`${collection}.${primary}`]),
			])
			.from(collection)
			.leftJoin({ published: shadowTable }, function () {
				this.on(`published.${primary}`, '=', `${collection}.${primary}`).andOnVal(
					`published.${VERSION_SYSTEM_FIELDS.type}`,
					'=',
					'published',
				);
			});

		if (link) {
			itemsQuery.leftJoin(linkTable, `${linkTable}.${primary}`, `${collection}.${primary}`);
		}

		source = itemsQuery.unionAll([versionsQuery]);
	}

	const versionField = (field: string): FieldOverview => ({
		...(shadow.fields[field] ?? shadow.fields[VERSION_SYSTEM_FIELDS.id]!),
		field,
	});

	const fields: Record<string, FieldOverview> = {
		...live.fields,
		...Object.fromEntries([...systemFields, ...referenceFields].map((field) => [field, versionField(field)])),
		[KEY_FIELD]: {
			...live.fields[primary]!,
			field: KEY_FIELD,
			type: isNumericKey ? live.fields[primary]!.type : 'string',
			special: [],
			defaultValue: null,
		},
	};

	// Relations of the live collection apply to the virtual collection as well, the references to versions of related
	// items come from the shadow table
	const relations = schema.relations.flatMap((relation) => [
		...(relation.collection === collection ||
		(relation.collection === shadowTable && relation.field.startsWith(VERSION_REFERENCE_PREFIX))
			? [{ ...relation, collection: name }]
			: []),
		...(relation.related_collection === collection ? [{ ...relation, related_collection: name }] : []),
	]);

	return {
		name,
		source,
		versionFields: [...systemFields, ...referenceFields],
		schema: {
			collections: { ...schema.collections, [name]: { ...live, collection: name, primary: KEY_FIELD, fields } },
			relations: [...schema.relations, ...relations],
		} as SchemaOverview,
	};
}
