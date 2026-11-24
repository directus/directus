import { ErrorCode, isDirectusError } from '@directus/errors';
import type { Accountability, FieldOverview, Filter, Item, Query, Relation, SchemaOverview } from '@directus/types';
import { getRelationInfo } from '@directus/utils';
import type { Knex } from 'knex';
import { isNil, isPlainObject, uniq } from 'lodash-es';
import { getAstFromQuery } from '../database/get-ast-from-query/get-ast-from-query.js';
import { getHelpers } from '../database/helpers/index.js';
import { getDatabaseClient } from '../database/index.js';
import { runAst } from '../database/run-ast/run-ast.js';
import { processAst } from '../permissions/modules/process-ast/process-ast.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { ItemsService } from '../services/items.js';
import {
	VERSION_FIELD,
	VERSION_REFERENCE_PREFIX,
	VERSION_SYSTEM_FIELDS,
} from '../services/version-tables/constants.js';
import { nestVersionSystemFields } from '../services/version-tables/utils.js';
import type { FieldNode } from '../types/ast.js';
import {
	deletePath,
	formatAggregate,
	getEngineFields,
	getRequestedRoots,
	getSubfields,
	injectPublishedSystemFields,
	isSystemField,
	mapAggregate,
	rewriteSort,
	toSystemColumn,
	trimSystemFields,
} from './fields.js';
import { rewriteFilter, stripSystemFilter } from './filter.js';
import { validateLinkAccess } from './link-access.js';

type Context = { knex: Knex; schema: SchemaOverview; accountability: Accountability | null };

/**
 * - `items`: live items, with the system fields of their published version, together with all other versions
 * - `versions`: all rows of the shadow table, used to resolve references to versions
 */
type ReadMode = 'items' | 'versions';

/** Unique key of the combined rows, as live primary keys and version ids overlap */
const KEY_FIELD = 'directus_version_key';

/**
 * Whether the query asks for versions, using `version=true`
 */
export function isVersionedQuery(query: Query) {
	return String(query.version) === 'true';
}

/**
 * Read live items and versions of a versioned collection in one result. Fields, filters and sorts on the version system fields
 * use the `directus_version.<key>` format. References to versions of related items are resolved as well.
 */
export async function readVersionedItems(
	collection: string,
	query: Query,
	context: Context,
	mode: ReadMode = 'items',
): Promise<Item[]> {
	const { knex, schema, accountability } = context;
	const { versioning } = getHelpers(knex);

	if (accountability && !accountability.admin) {
		await validateAccess(
			{ accountability, action: 'read', collection: versioning.getShadowTableName(collection) },
			{ knex, schema },
		);
	}

	const isAggregate = Boolean(query.group || Object.keys(query.aggregate ?? {}).length > 0);
	const fields = query.fields ?? ['*'];
	const { primary } = schema.collections[collection]!;
	const engineFields = getEngineFields(schema, collection, fields);

	// The query is validated against the live collection, so its permissions apply. Version system fields aren't part of it
	const liveQuery: Query = {
		...query,
		...(isAggregate ? {} : { fields: engineFields.fields }),
		...(query.group ? { group: query.group.filter((field) => !isSystemField(field)) } : {}),
		...(query.aggregate
			? { aggregate: mapAggregate(query.aggregate, (fields) => fields.filter((field) => !isSystemField(field))) }
			: {}),
		filter: stripSystemFilter(query.filter),
		sort: query.sort?.filter((sort) => !isSystemField(sort.replace(/^-/, ''))) ?? null,
	};

	delete liveQuery.version;

	let ast = await getAstFromQuery({ collection, query: liveQuery, accountability }, { schema, knex });
	ast = await processAst({ ast, action: 'read', accountability }, { knex, schema });

	const virtual = createVirtualCollection(knex, schema, collection, mode);
	const filterShadows = new Set<string>();

	ast.name = virtual.name;

	ast.query = {
		...ast.query,
		filter: query.filter
			? rewriteFilter(query.filter, {
					schema: virtual.schema,
					versioning,
					collection: virtual.name,
					hasSystemFields: true,
					references: true,
					shadows: filterShadows,
				})
			: null,
		sort: query.sort?.map(rewriteSort) ?? null,
		...(query.group ? { group: query.group.map(toSystemColumn) } : {}),
		...(query.aggregate ? { aggregate: mapAggregate(query.aggregate, (fields) => fields.map(toSystemColumn)) } : {}),
	};

	// Filters on versions of related items require access to them
	if (accountability && !accountability.admin) {
		for (const shadowTable of filterShadows) {
			await validateAccess({ accountability, action: 'read', collection: shadowTable }, { knex, schema });
		}
	}

	for (const child of ast.children) {
		if (child.type === 'm2o' || child.type === 'a2o') child.relation = { ...child.relation, collection: virtual.name };
		if (child.type === 'o2m') child.relation = { ...child.relation, related_collection: virtual.name };
	}

	const hasPrimary = ast.children.some((child) => child.type === 'field' && child.fieldKey === primary);

	const addedFields = isAggregate
		? (query.group ?? []).filter(isSystemField).map(toSystemColumn)
		: [...(hasPrimary ? [] : [primary]), ...virtual.versionFields];

	ast.children.push(
		...addedFields.map(
			(field): FieldNode => ({ type: 'field', name: field, fieldKey: field, whenCase: [], alias: false }),
		),
	);

	const items = ((await runAst(ast, virtual.schema, accountability, { knex, source: virtual.source })) ?? []) as Item[];

	if (isAggregate) return items.map((item) => formatAggregate(item, query));

	await resolveVersionReferences(collection, items, fields, context, mode);

	return items.map(nestVersionSystemFields).map((item) => {
		for (const field of addedFields) {
			delete item[field];
		}

		for (const path of engineFields.added) {
			deletePath(item, path);
		}

		injectPublishedSystemFields(item, fields);

		return item;
	});
}

/**
 * Count the live items and versions matching the filter and search of the query
 */
export async function countVersionedItems(collection: string, query: Query, context: Context): Promise<number> {
	const [result] = await readVersionedItems(
		collection,
		{ filter: query.filter ?? null, search: query.search ?? null, aggregate: { count: ['*'] } },
		context,
	);

	const count = result?.['count'];

	return Number((isPlainObject(count) ? count['*'] : count) ?? 0);
}

/**
 * A collection that reads from the combined live and version rows. It has its own name and primary key,
 * as the live primary key isn't unique across those rows.
 */
function createVirtualCollection(knex: Knex, schema: SchemaOverview, collection: string, mode: ReadMode) {
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

/**
 * Resolve m2o references to versions of related items and the related items of o2m relations for versions,
 * which are stored in the shadow and link tables instead of the foreign key of the live relation
 */
async function resolveVersionReferences(
	collection: string,
	items: Item[],
	fields: string[],
	context: Context,
	mode: ReadMode,
) {
	const { schema } = context;

	for (const field of getRequestedRoots(schema, collection, fields)) {
		const subfields = getSubfields(fields, field);
		const { relation, relationType } = getRelationInfo(schema.relations, collection, field);

		if (relationType === 'm2o' || relationType === 'a2o') {
			await resolveM2O(items, relation!, subfields, context);
		} else if (relationType === 'o2m') {
			const versions = items.filter((item) => mode === 'versions' || item[VERSION_SYSTEM_FIELDS.type] !== 'published');

			await resolveO2M(versions, relation!, subfields, context);
		}
	}
}

/**
 * Replace the empty m2o field of versions that reference a version of the related item with that version. Without
 * requested subfields, or for related collections that aren't versioned, only `{ directus_version: { id } }` is set.
 */
async function resolveM2O(items: Item[], relation: Relation, subfields: string[], context: Context) {
	const { versioning } = getHelpers(context.knex);
	const referenceField = versioning.getVersionReferenceField(relation.field);
	const pending = items.filter((item) => isNil(item[relation.field]) && !isNil(item[referenceField]));

	if (pending.length === 0) return;

	const related = relation.related_collection;

	// a2o references and requests for keys only return the reference itself
	if (!related || subfields.length === 0 || !context.schema.collections[related]?.versioned) {
		for (const item of pending) {
			item[relation.field] = { [VERSION_FIELD]: { id: item[referenceField] } };
		}

		return;
	}

	const versions = await readVersionsById(
		related,
		subfields,
		pending.map((item) => item[referenceField]),
		context,
	);

	for (const item of pending) {
		item[relation.field] = versions.get(String(item[referenceField])) ?? null;
	}
}

/**
 * Set the o2m field of versions to their related items: live items linked through the link table and versions of
 * related items referencing them. Without requested subfields, only the keys and version ids are set.
 * Linked live items the user can't read are left out.
 */
async function resolveO2M(versions: Item[], relation: Relation, subfields: string[], context: Context) {
	const { knex, schema } = context;
	const field = relation.meta!.one_field!;
	const versionIds = versions.map((item) => item[VERSION_SYSTEM_FIELDS.id]).filter((id) => !isNil(id));

	if (versionIds.length === 0) return;

	const related = relation.collection;
	const { primary } = schema.collections[related]!;
	const { versioning } = getHelpers(knex);
	const linkTable = versioning.getLinkTableName(related);
	const shadowTable = versioning.getShadowTableName(related);
	const referenceField = versioning.getVersionReferenceField(relation.field);
	const children = new Map<string, unknown[]>();

	const addChild = (versionId: unknown, child: unknown) => {
		if (child === undefined) return;

		const key = String(versionId);
		children.set(key, [...(children.get(key) ?? []), child]);
	};

	// Live items linked to the versions
	if (schema.collections[linkTable]?.fields[relation.field]) {
		let links = await knex(linkTable).select(primary, relation.field).whereIn(relation.field, versionIds);

		const canReadLinks = await validateLinkAccess(
			{
				collection: related,
				action: 'read',
				keys: links.map((link) => link[primary]),
				accountability: context.accountability,
			},
			{ knex, schema },
		).then(
			() => true,
			(error) => {
				if (isDirectusError(error, ErrorCode.Forbidden)) return false;
				throw error;
			},
		);

		if (!canReadLinks) links = [];

		const liveItems =
			subfields.length > 0
				? await readLiveById(
						related,
						subfields,
						links.map((link) => link[primary]),
						context,
					)
				: null;

		for (const link of links) {
			addChild(link[relation.field], liveItems ? liveItems.get(String(link[primary])) : link[primary]);
		}
	}

	// Versions of related items that belong to the versions
	if (schema.collections[shadowTable]?.fields[referenceField]) {
		const references = await knex(shadowTable)
			.select(VERSION_SYSTEM_FIELDS.id, referenceField)
			.whereIn(referenceField, versionIds);

		const relatedVersions =
			subfields.length > 0
				? await readVersionsById(
						related,
						subfields,
						references.map((reference) => reference[VERSION_SYSTEM_FIELDS.id]),
						context,
					)
				: null;

		for (const reference of references) {
			const versionId = reference[VERSION_SYSTEM_FIELDS.id];

			addChild(
				reference[referenceField],
				relatedVersions ? relatedVersions.get(String(versionId)) : { [VERSION_FIELD]: { id: versionId } },
			);
		}
	}

	for (const item of versions) {
		item[field] = children.get(String(item[VERSION_SYSTEM_FIELDS.id])) ?? [];
	}
}

/**
 * Read versions of a collection by their version id, mapped by the stringified id
 */
async function readVersionsById(collection: string, subfields: string[], ids: unknown[], context: Context) {
	const items = await readVersionedItems(
		collection,
		{
			fields: [...subfields, `${VERSION_FIELD}.id`],
			filter: { [VERSION_FIELD]: { id: { _in: uniq(ids) } } } as Filter,
			limit: -1,
		},
		context,
		'versions',
	);

	return new Map(
		items.map((item) => {
			const id = String(item[VERSION_FIELD].id);
			trimSystemFields(item, subfields);
			return [id, item];
		}),
	);
}

/**
 * Read published live items of a collection by their primary key, mapped by the stringified key. The primary key is
 * only kept on the items if it was requested.
 */
async function readLiveById(collection: string, subfields: string[], keys: unknown[], context: Context) {
	const { knex, schema, accountability } = context;
	const { primary } = schema.collections[collection]!;
	const fields = uniq([...subfields, primary]);
	const filter = { [primary]: { _in: uniq(keys) } } as Filter;

	let items: Item[];

	if (schema.collections[collection]?.versioned) {
		items = await readVersionedItems(
			collection,
			{
				fields,
				filter: { _and: [filter, { [VERSION_FIELD]: { type: { _eq: 'published' } } }] } as Filter,
				limit: -1,
			},
			context,
		);
	} else {
		const engineFields = getEngineFields(schema, collection, fields);
		const service = new ItemsService(collection, { knex, schema, accountability });

		items = await service.readByQuery({ fields: engineFields.fields, filter, limit: -1 });

		for (const item of items) {
			for (const path of engineFields.added) deletePath(item, path);
			injectPublishedSystemFields(item, fields);
		}
	}

	const keepPrimary = subfields.some((field) => field === '*' || field.split('.')[0] === primary);

	return new Map(
		items.map((item) => {
			const key = String(item[primary]);
			if (!keepPrimary) delete item[primary];
			return [key, item];
		}),
	);
}
