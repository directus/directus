import { ErrorCode, InvalidQueryError, isDirectusError } from '@directus/errors';
import type {
	Accountability,
	Aggregate,
	FieldOverview,
	Filter,
	Item,
	Query,
	Relation,
	SchemaOverview,
} from '@directus/types';
import { toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { isNil, isPlainObject, mapKeys, pick, uniq } from 'lodash-es';
import { getAstFromQuery } from '../database/get-ast-from-query/get-ast-from-query.js';
import { getDatabaseClient } from '../database/index.js';
import { runAst } from '../database/run-ast/run-ast.js';
import { processAst } from '../permissions/modules/process-ast/process-ast.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { ItemsService } from '../services/items.js';
import {
	getLinkTableName,
	getShadowTableName,
	getVersionReferenceField,
	isVersionedCollection,
	toVersionMeta,
	VERSION_META_FIELD,
	VERSION_META_FIELDS,
	VERSION_META_KEYS,
	VERSION_REFERENCE_PREFIX,
} from '../services/version-tables/constants.js';
import type { FieldNode } from '../types/ast.js';
import { validateLinkAccess } from './link-access.js';

type Context = { knex: Knex; schema: SchemaOverview; accountability: Accountability | null };

/**
 * - `items`: live items, with the meta of their published version, together with all other versions
 * - `versions`: all rows of the shadow table, used to resolve references to versions
 */
type ReadMode = 'items' | 'versions';

/** Unique key of the combined rows, as live primary keys and version ids overlap */
const KEY_FIELD = 'directus_version_key';

export function isVersionedQuery(query: Query) {
	return String(query.version) === 'true';
}

/**
 * Read live items and versions of a versioned collection in one result. Fields, filters and sorts on the version meta
 * use the `directus_version.<key>` format. References to versions of related items are resolved as well.
 */
export async function readVersionedItems(
	collection: string,
	query: Query,
	context: Context,
	mode: ReadMode = 'items',
): Promise<Item[]> {
	const { knex, schema, accountability } = context;

	if (accountability && !accountability.admin) {
		await validateAccess(
			{ accountability, action: 'read', collection: getShadowTableName(collection) },
			{ knex, schema },
		);
	}

	const isAggregate = Boolean(query.group || Object.keys(query.aggregate ?? {}).length > 0);
	const fields = query.fields ?? ['*'];
	const { primary } = schema.collections[collection]!;
	const engineFields = getEngineFields(schema, collection, fields);

	// The query is validated against the live collection, so its permissions apply. Version meta isn't part of it
	const liveQuery: Query = {
		...query,
		...(isAggregate ? {} : { fields: engineFields.fields }),
		...(query.group ? { group: query.group.filter((field) => !isMetaField(field)) } : {}),
		...(query.aggregate
			? { aggregate: mapAggregate(query.aggregate, (fields) => fields.filter((field) => !isMetaField(field))) }
			: {}),
		filter: stripMetaFilter(query.filter),
		sort: query.sort?.filter((sort) => !isMetaField(sort.replace(/^-/, ''))) ?? null,
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
					collection: virtual.name,
					hasMeta: true,
					references: true,
					shadows: filterShadows,
				})
			: null,
		sort: query.sort?.map(rewriteSort) ?? null,
		...(query.group ? { group: query.group.map(toMetaColumn) } : {}),
		...(query.aggregate ? { aggregate: mapAggregate(query.aggregate, (fields) => fields.map(toMetaColumn)) } : {}),
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
		? (query.group ?? []).filter(isMetaField).map(toMetaColumn)
		: [...(hasPrimary ? [] : [primary]), ...virtual.versionFields];

	ast.children.push(
		...addedFields.map(
			(field): FieldNode => ({ type: 'field', name: field, fieldKey: field, whenCase: [], alias: false }),
		),
	);

	const items = ((await runAst(ast, virtual.schema, accountability, { knex, source: virtual.source })) ?? []) as Item[];

	if (isAggregate) return items.map((item) => formatAggregate(item, query));

	await resolveVersionReferences(collection, items, fields, context, mode);

	return items.map((item) => {
		item[VERSION_META_FIELD] = toVersionMeta(item);

		for (const field of addedFields) {
			delete item[field];
		}

		for (const path of engineFields.added) {
			deletePath(item, path);
		}

		injectPublishedMeta(item, fields);

		return item;
	});
}

/**
 * Group and aggregate results on version meta use the same format as the query: grouped meta values end up in
 * `directus_version`, aggregated ones under their `directus_version.<key>` name
 */
function formatAggregate(item: Item, query: Query) {
	for (const [key, column] of Object.entries(VERSION_META_KEYS)) {
		if (!(column in item)) continue;

		item[VERSION_META_FIELD] = { ...item[VERSION_META_FIELD], [key]: item[column] };
		delete item[column];
	}

	for (const aggregate of Object.keys(query.aggregate ?? {})) {
		if (!isPlainObject(item[aggregate])) continue;

		item[aggregate] = mapKeys(item[aggregate], (_value, column) => {
			const key = Object.keys(VERSION_META_KEYS).find((key) => VERSION_META_KEYS[key] === column);
			return key ? `${VERSION_META_FIELD}.${key}` : column;
		});
	}

	return item;
}

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
	const shadowTable = getShadowTableName(collection);
	const shadow = schema.collections[shadowTable]!;
	const linkTable = getLinkTableName(collection);
	const link = schema.collections[linkTable];

	const columns = Object.values(live.fields)
		.filter((field) => !field.alias)
		.map((field) => field.field);

	const metaFields: string[] = Object.values(VERSION_META_FIELDS);
	const linkedFields = link ? Object.keys(link.fields).filter((field) => field !== primary) : [];

	const referenceFields = uniq([
		...Object.keys(shadow.fields).filter((field) => field.startsWith(VERSION_REFERENCE_PREFIX)),
		...linkedFields.map(getVersionReferenceField),
	]);

	const isNumericKey = ['integer', 'bigInteger'].includes(live.fields[primary]!.type);

	// Live rows keep their primary key as key, versions use their negative id, so o2m relations of live rows still work.
	// MySQL version ids are unsigned, so they need to be signed before they can be negated.
	const negatedVersionId = getDatabaseClient(knex) === 'mysql' ? '-1 * CAST(?? AS SIGNED)' : '-1 * ??';

	const selectKey = (sql: string, bindings: string[]) =>
		isNumericKey
			? knex.raw(`${sql} as ??`, [...bindings, KEY_FIELD])
			: knex.raw(`CAST(${sql} AS ${getStringType(knex)}) as ??`, [...bindings, KEY_FIELD]);

	const selectColumn = (table: string, exists: boolean, column: string, alias = column) =>
		exists ? knex.ref(`${table}.${column}`).as(alias) : knex.raw('NULL as ??', [alias]);

	const versionsQuery = knex
		.select([
			...columns.map((column) => selectColumn(shadowTable, column in shadow.fields, column)),
			...metaFields.map((column) => selectColumn(shadowTable, true, column)),
			...referenceFields.map((column) => selectColumn(shadowTable, column in shadow.fields, column)),
			selectKey(negatedVersionId, [`${shadowTable}.${VERSION_META_FIELDS.id}`]),
		])
		.from(shadowTable);

	let source = versionsQuery;

	if (mode === 'items') {
		// Published versions are represented by the live item
		versionsQuery.whereNot(`${shadowTable}.${VERSION_META_FIELDS.type}`, 'published');

		const itemsQuery = knex
			.select([
				...columns.map((column) => selectColumn(collection, true, column)),
				...metaFields.map((column) =>
					column === VERSION_META_FIELDS.type
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
					`published.${VERSION_META_FIELDS.type}`,
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
		...(shadow.fields[field] ?? shadow.fields[VERSION_META_FIELDS.id]!),
		field,
	});

	const fields: Record<string, FieldOverview> = {
		...live.fields,
		...Object.fromEntries([...metaFields, ...referenceFields].map((field) => [field, versionField(field)])),
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
		versionFields: [...metaFields, ...referenceFields],
		schema: {
			collections: { ...schema.collections, [name]: { ...live, collection: name, primary: KEY_FIELD, fields } },
			relations: [...schema.relations, ...relations],
		} as SchemaOverview,
	};
}

/**
 * Fields for the query against the live collection, without version meta. Relations that only had version meta
 * requested select their primary key instead, which is removed again afterwards.
 */
function getEngineFields(schema: SchemaOverview, collection: string, fields: string[]) {
	const result: string[] = [];
	const added: string[] = [];

	for (const field of fields) {
		const path = field.split('.');
		const index = path.indexOf(VERSION_META_FIELD);

		if (index === -1) {
			result.push(field);
			continue;
		}

		const related = index > 0 ? getRelatedCollection(schema, collection, path.slice(0, index)) : null;

		if (related) {
			const primaryPath = [...path.slice(0, index), schema.collections[related]!.primary].join('.');

			if (!fields.includes(primaryPath)) added.push(primaryPath);

			result.push(primaryPath);
		}
	}

	return { fields: result.length > 0 ? uniq(result) : [schema.collections[collection]!.primary], added: uniq(added) };
}

function getRelatedCollection(schema: SchemaOverview, collection: string, path: string[]) {
	let current: string | null = collection;

	for (const segment of path) {
		const m2o = getM2ORelation(schema, current!, segment);
		const o2m = getO2MRelation(schema, current!, segment);

		current = m2o ? m2o.related_collection : (o2m?.collection ?? null);

		if (!current) return null;
	}

	return current;
}

function mapAggregate(aggregate: Aggregate, map: (fields: string[]) => string[]): Aggregate {
	return Object.fromEntries(Object.entries(aggregate).map(([func, fields]) => [func, map(fields ?? [])]));
}

function isMetaField(field: string) {
	return field === VERSION_META_FIELD || field.startsWith(`${VERSION_META_FIELD}.`);
}

function toMetaColumn(field: string) {
	return isMetaField(field) ? getMetaColumn(field.slice(VERSION_META_FIELD.length + 1)) : field;
}

/**
 * Remove version meta from a filter, which leaves the parts that can be validated against the live collection
 */
function stripMetaFilter(filter: Filter | null | undefined): Filter | null {
	if (!filter) return null;

	const strip = (value: unknown): unknown => {
		if (Array.isArray(value)) {
			return value.map(strip).filter((nested) => !isPlainObject(nested) || Object.keys(nested as object).length > 0);
		}

		if (!isPlainObject(value)) return value;

		const result: Record<string, unknown> = {};

		for (const [key, nested] of Object.entries(value as object)) {
			if (key === VERSION_META_FIELD) continue;

			const stripped = strip(nested);

			if (isPlainObject(nested) && Object.keys(stripped as object).length === 0) continue;
			if ((key === '_and' || key === '_or') && (stripped as unknown[]).length === 0) continue;

			result[key] = stripped;
		}

		return result;
	};

	return strip(filter) as Filter;
}

type FilterLevel = {
	schema: SchemaOverview;
	/** Collection the filter applies to, which is the virtual collection, a shadow table or a live collection */
	collection: string;
	/** Whether the rows have version meta columns, otherwise they're live items and match the meta of published items */
	hasMeta: boolean;
	/** Whether m2o relations can reference versions of related items */
	references: boolean;
	/** Shadow tables the filter reads from */
	shadows: Set<string>;
};

/**
 * Map version meta in the filter to the meta columns. An m2o relation to a versioned collection matches either
 * the linked live item or the referenced version, so nested filters (including version meta) apply to both.
 */
function rewriteFilter(filter: Filter, level: FilterLevel): Filter {
	const result: Record<string, unknown> = {};
	const conditions: Filter[] = [];

	const rewriteAt = (value: unknown, collection: string, versioned: boolean) =>
		rewriteFilter(value as Filter, { ...level, collection, hasMeta: versioned, references: versioned });

	for (const [key, value] of Object.entries(filter)) {
		if ((key === '_and' || key === '_or') && Array.isArray(value)) {
			result[key] = value.map((nested) => rewriteFilter(nested, level));
			continue;
		}

		if (key === '_some' || key === '_none') {
			result[key] = rewriteFilter(value as Filter, level);
			continue;
		}

		if (key === VERSION_META_FIELD) {
			if (level.hasMeta) {
				Object.assign(
					result,
					mapKeys(value ?? {}, (_, metaKey) => getMetaColumn(metaKey)),
				);
			} else if (!matchesPublishedMeta(value as Record<string, Record<string, unknown>>)) {
				// Never matches, as an empty `_in` compiles to `1 = 0`. A `_null` check on the primary key would still match
				// rows without a related item, as relations are left joined
				conditions.push({ [level.schema.collections[level.collection]!.primary]: { _in: [] } } as Filter);
			}

			continue;
		}

		const related = isPlainObject(value) && !key.startsWith('_') && !isFieldCondition(value as Record<string, unknown>);
		const m2oCollection = related ? getM2ORelation(level.schema, level.collection, key)?.related_collection : null;
		const o2m = related && !m2oCollection ? getO2MRelation(level.schema, level.collection, key) : null;

		if (o2m) {
			result[key] = rewriteAt(value, o2m.collection, false);
			continue;
		}

		if (!m2oCollection) {
			result[key] = value;
			continue;
		}

		const live = nestOrExists(key, rewriteAt(value, m2oCollection, false));
		const referenceField = getVersionReferenceField(key);

		const shadow = level.references
			? getM2ORelation(level.schema, level.collection, referenceField)?.related_collection
			: null;

		if (shadow) {
			level.shadows.add(shadow);

			const version = nestOrExists(referenceField, rewriteAt(value, shadow, true));
			conditions.push({ _or: [live, { _and: [{ [key]: { _null: true } }, version] }] } as Filter);
		} else if ('_and' in live || '_or' in live) {
			conditions.push(live);
		} else {
			Object.assign(result, live);
		}
	}

	if (conditions.length === 0) return result as Filter;
	if (Object.keys(result).length > 0) conditions.unshift(result as Filter);

	return { _and: conditions } as Filter;
}

/** Nest a filter under an m2o field. A filter left without conditions still requires the related item to exist */
function nestOrExists(field: string, filter: Filter): Filter {
	return Object.keys(filter).length > 0 ? nestFilter(field, filter) : ({ [field]: { _nnull: true } } as Filter);
}

/**
 * Nest a filter on the related item under an m2o field. The filter engine only follows the first key of a nested
 * filter and doesn't support logical operators below a relation, so those are moved above the field instead, which
 * is equivalent for m2o relations: `{ author: { _and: [a, b] } }` becomes `{ _and: [{ author: a }, { author: b }] }`.
 */
function nestFilter(field: string, filter: Filter): Filter {
	const parts = Object.entries(filter).map(([key, value]): Filter => {
		if ((key === '_and' || key === '_or') && Array.isArray(value)) {
			return { [key]: value.map((nested: Filter) => nestFilter(field, nested)) } as Filter;
		}

		return { [field]: { [key]: value } } as Filter;
	});

	return parts.length === 1 ? parts[0]! : ({ _and: parts } as Filter);
}

/**
 * Operators directly on a field, like `author: { _null: true }`, as opposed to a filter on the related item
 */
function isFieldCondition(value: Record<string, unknown>) {
	return Object.keys(value).every((key) => key.startsWith('_') && !['_and', '_or', '_some', '_none'].includes(key));
}

const PUBLISHED_META: Record<string, unknown> = {
	...Object.fromEntries(Object.keys(VERSION_META_KEYS).map((key) => [key, null])),
	type: 'published',
};

function matchesPublishedMeta(filter: Record<string, Record<string, unknown>>) {
	return Object.entries(filter ?? {}).every(([key, condition]) => {
		getMetaColumn(key);

		return Object.entries(condition ?? {}).every(([operator, argument]) =>
			matchesOperator(PUBLISHED_META[key], operator, argument),
		);
	});
}

function matchesOperator(value: unknown, operator: string, argument: unknown) {
	const flag = argument === true || argument === 'true' || argument === 1 || argument === '1';

	switch (operator) {
		case '_eq':
			return value === argument;
		case '_neq':
			return value !== argument;
		case '_in':
			return toArray(argument as unknown).includes(value);
		case '_nin':
			return !toArray(argument as unknown).includes(value);
		case '_null':
		case '_empty':
			return (value === null) === flag;
		case '_nnull':
		case '_nempty':
			return (value !== null) === flag;
		case '_contains':
		case '_icontains':
			return typeof value === 'string' && value.toLowerCase().includes(String(argument).toLowerCase());
		case '_starts_with':
		case '_istarts_with':
			return typeof value === 'string' && value.toLowerCase().startsWith(String(argument).toLowerCase());
		case '_ends_with':
		case '_iends_with':
			return typeof value === 'string' && value.toLowerCase().endsWith(String(argument).toLowerCase());
		default:
			// Comparisons with null never match, like in the database
			if (value === null) return false;

			throw new InvalidQueryError({
				reason: `Operator "${operator}" isn't supported on "${VERSION_META_FIELD}" of live items`,
			});
	}
}

function rewriteSort(sort: string) {
	const descending = sort.startsWith('-');

	return `${descending ? '-' : ''}${toMetaColumn(descending ? sort.slice(1) : sort)}`;
}

function getMetaColumn(key: string) {
	const column = VERSION_META_KEYS[key];

	if (!column) throw new InvalidQueryError({ reason: `"${VERSION_META_FIELD}.${key}" doesn't exist` });

	return column;
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
		const m2o = getM2ORelation(schema, collection, field);

		if (m2o) {
			await resolveM2O(items, m2o, subfields, context);
			continue;
		}

		const o2m = getO2MRelation(schema, collection, field);

		if (o2m) {
			const versions = items.filter((item) => mode === 'versions' || item[VERSION_META_FIELDS.type] !== 'published');

			await resolveO2M(versions, o2m, subfields, context);
		}
	}
}

async function resolveM2O(items: Item[], relation: Relation, subfields: string[], context: Context) {
	const referenceField = getVersionReferenceField(relation.field);
	const pending = items.filter((item) => isNil(item[relation.field]) && !isNil(item[referenceField]));

	if (pending.length === 0) return;

	const related = relation.related_collection;

	// a2o references and requests for keys only return the reference itself
	if (!related || subfields.length === 0 || !isVersionedCollection(context.schema, related)) {
		for (const item of pending) {
			item[relation.field] = { [VERSION_META_FIELD]: { id: item[referenceField] } };
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

async function resolveO2M(versions: Item[], relation: Relation, subfields: string[], context: Context) {
	const { knex, schema } = context;
	const field = relation.meta!.one_field!;
	const versionIds = versions.map((item) => item[VERSION_META_FIELDS.id]).filter((id) => !isNil(id));

	if (versionIds.length === 0) return;

	const related = relation.collection;
	const { primary } = schema.collections[related]!;
	const linkTable = getLinkTableName(related);
	const shadowTable = getShadowTableName(related);
	const referenceField = getVersionReferenceField(relation.field);
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
			.select(VERSION_META_FIELDS.id, referenceField)
			.whereIn(referenceField, versionIds);

		const relatedVersions =
			subfields.length > 0
				? await readVersionsById(
						related,
						subfields,
						references.map((reference) => reference[VERSION_META_FIELDS.id]),
						context,
					)
				: null;

		for (const reference of references) {
			const versionId = reference[VERSION_META_FIELDS.id];

			addChild(
				reference[referenceField],
				relatedVersions ? relatedVersions.get(String(versionId)) : { [VERSION_META_FIELD]: { id: versionId } },
			);
		}
	}

	for (const item of versions) {
		item[field] = children.get(String(item[VERSION_META_FIELDS.id])) ?? [];
	}
}

async function readVersionsById(collection: string, subfields: string[], ids: unknown[], context: Context) {
	const items = await readVersionedItems(
		collection,
		{
			fields: [...subfields, `${VERSION_META_FIELD}.id`],
			filter: { [VERSION_META_FIELD]: { id: { _in: uniq(ids) } } } as Filter,
			limit: -1,
		},
		context,
		'versions',
	);

	return new Map(
		items.map((item) => {
			const id = String(item[VERSION_META_FIELD].id);
			trimVersionMeta(item, subfields);
			return [id, item];
		}),
	);
}

async function readLiveById(collection: string, subfields: string[], keys: unknown[], context: Context) {
	const { knex, schema, accountability } = context;
	const { primary } = schema.collections[collection]!;
	const fields = uniq([...subfields, primary]);
	const filter = { [primary]: { _in: uniq(keys) } } as Filter;

	let items: Item[];

	if (isVersionedCollection(schema, collection)) {
		items = await readVersionedItems(
			collection,
			{
				fields,
				filter: { _and: [filter, { [VERSION_META_FIELD]: { type: { _eq: 'published' } } }] } as Filter,
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
			injectPublishedMeta(item, fields);
		}
	}

	return new Map(
		items.map((item) => {
			const key = String(item[primary]);
			if (!requestsField(subfields, primary)) delete item[primary];
			return [key, item];
		}),
	);
}

/**
 * Items that aren't versions show up with the meta of a published item, if version meta is requested for them
 */
function injectPublishedMeta(item: Item, fields: string[]) {
	if (!isPlainObject(item)) return;

	if (item[VERSION_META_FIELD] === undefined && requestedMetaKeys(fields).length > 0) {
		item[VERSION_META_FIELD] = { ...PUBLISHED_META };
	}

	if (item[VERSION_META_FIELD] !== undefined) trimVersionMeta(item, fields);

	for (const root of uniq(fields.map((field) => field.split('.')[0]!))) {
		if (root === VERSION_META_FIELD || root === '*') continue;

		const subfields = getSubfields(fields, root);

		if (subfields.length === 0) continue;

		for (const value of toArray(item[root] ?? [])) {
			injectPublishedMeta(value, subfields);
		}
	}

	return item;
}

function trimVersionMeta(item: Item, fields: string[]) {
	const keys = requestedMetaKeys(fields);

	if (keys.length === 0) {
		delete item[VERSION_META_FIELD];
	} else {
		item[VERSION_META_FIELD] = pick(item[VERSION_META_FIELD], keys);
	}
}

function requestedMetaKeys(fields: string[]) {
	const keys = new Set<string>();

	for (const field of fields) {
		const [root, key] = field.split('.');

		if (root !== VERSION_META_FIELD) continue;

		if (!key || key === '*') return Object.keys(VERSION_META_KEYS);

		getMetaColumn(key);
		keys.add(key);
	}

	return [...keys];
}

function requestsField(fields: string[], field: string) {
	return fields.some((requested) => requested === '*' || requested.split('.')[0] === field);
}

function getRequestedRoots(schema: SchemaOverview, collection: string, fields: string[]) {
	const roots = new Set<string>();

	for (const field of fields) {
		const root = field.split('.')[0]!;

		if (root === '*') {
			Object.keys(schema.collections[collection]!.fields).forEach((field) => roots.add(field));
		} else if (root !== VERSION_META_FIELD) {
			roots.add(root);
		}
	}

	return [...roots];
}

function getSubfields(fields: string[], root: string) {
	return fields.flatMap((field) => {
		if (field.startsWith(`${root}.`)) return [field.slice(root.length + 1)];
		if (field.startsWith('*.')) return [field.slice(2)];
		return [];
	});
}

function deletePath(item: unknown, path: string) {
	if (!isPlainObject(item)) return;

	const [root, ...rest] = path.split('.');
	const value = (item as Item)[root!];

	if (rest.length === 0) {
		delete (item as Item)[root!];
		return;
	}

	for (const nested of toArray(value ?? [])) {
		deletePath(nested, rest.join('.'));
	}
}

function getM2ORelation(schema: SchemaOverview, collection: string, field: string) {
	return schema.relations.find((relation) => relation.collection === collection && relation.field === field);
}

export function getO2MRelation(schema: SchemaOverview, collection: string, field: string) {
	return schema.relations.find(
		(relation) => relation.related_collection === collection && relation.meta?.one_field === field,
	);
}

function getStringType(knex: Knex) {
	switch (getDatabaseClient(knex)) {
		case 'mysql':
			return 'CHAR(255)';
		case 'mssql':
			return 'NVARCHAR(255)';
		case 'oracle':
			return 'VARCHAR2(255)';
		default:
			return 'VARCHAR(255)';
	}
}
