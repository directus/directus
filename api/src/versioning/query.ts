import type { Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getHelpers } from '../database/helpers/index.js';
import { VERSION_FIELD, VERSION_SYSTEM_FIELDS } from '../services/version-tables/constants.js';
import type { AST, NestedCollectionNode, VersionedNode } from '../types/ast.js';
import { type AstLevel, getAstLevels } from '../utils/get-ast-levels.js';
import {
	getRelatedCollection,
	getSystemColumn,
	isSystemField,
	mapAggregate,
	rewriteSort,
	toSystemColumn,
} from './fields.js';
import { addShadow, type FilterLevel, rewriteFilter, stripSystemFilter } from './filter.js';
import { getVersionedRead } from './schema.js';

type Context = { knex: Knex; schema: SchemaOverview };

/**
 * Whether the query asks for versions, using `version=true`
 */
export function isVersionedQuery(query: Query) {
	return String(query.version) === 'true';
}

/**
 * Split the query of a node into the query on the live collection, which permissions are validated against, and the parts
 * that apply to the combined rows of live items and versions. Filters and sorts on the version system fields use the
 * `directus_version.<key>` format.
 */
export function splitVersionedQuery(collection: string, query: Query, context: Context) {
	const { knex, schema } = context;
	const { versioning } = getHelpers(knex);

	const liveQuery: Query = {
		...query,
		...(query.group ? { group: query.group.filter((field) => !isSystemField(field)) } : {}),
		...(query.aggregate
			? { aggregate: mapAggregate(query.aggregate, (fields) => fields.filter((field) => !isSystemField(field))) }
			: {}),
		filter: stripSystemFilter(query.filter),
		sort: query.sort?.filter((sort) => !isSystemField(sort.replace(/^-/, ''))) ?? null,
	};

	delete liveQuery.version;

	const read = getVersionedRead(knex, schema, collection);
	const shadows: FilterLevel['shadows'] = new Map();

	if (schema.collections[collection]?.versioned) addShadow(shadows, versioning.getShadowTableName(collection));

	// Filters on versions of related items require access to them as well
	const filter = query.filter
		? rewriteFilter(query.filter, {
				schema: read.schema,
				versioning,
				collection: read.name,
				hasSystemFields: true,
				references: true,
				shadows,
			})
		: null;

	const versioned: Omit<VersionedNode, 'fields' | 'reference'> = {
		query: {
			filter,
			...(query.sort ? { sort: query.sort.map(rewriteSort) } : {}),
			...(query.group ? { group: query.group.map(toSystemColumn) } : {}),
			...(query.aggregate ? { aggregate: mapAggregate(query.aggregate, (fields) => fields.map(toSystemColumn)) } : {}),
		},
		shadow: read.shadow,
		shadows: Object.fromEntries([...shadows].map(([shadow, fields]) => [shadow, [...fields]])),
	};

	return { query: liveQuery, versioning: versioned, versionFields: read.versionFields };
}

/**
 * Remove the version system fields from the requested fields, collected per relational path (`''` for the root).
 * Relations that only have version system fields requested select their primary key instead, so their node exists;
 * their paths are listed in `added`.
 */
export function splitVersionFields(schema: SchemaOverview, collection: string, fields: string[]) {
	const result: string[] = [];
	const systemFields = new Map<string, Set<string>>();
	const added = new Set<string>();

	for (const field of fields) {
		const path = field.split('.');
		const index = path.indexOf(VERSION_FIELD);

		if (index === -1) {
			result.push(field);
			continue;
		}

		const prefix = path.slice(0, index);
		const related = prefix.length > 0 ? getRelatedCollection(schema, collection, prefix) : collection;

		// Version system fields of a2o related items require the related collection, `item:articles`
		if (!related) continue;

		const key = prefix.join('.');
		const keys = systemFields.get(key) ?? new Set<string>();
		const systemKey = path[index + 1];

		if (!systemKey || systemKey === '*') {
			Object.keys(VERSION_SYSTEM_FIELDS).forEach((systemKey) => keys.add(systemKey));
		} else {
			getSystemColumn(systemKey);
			keys.add(systemKey);
		}

		systemFields.set(key, keys);

		if (prefix.length > 0) added.add(key);
	}

	for (const key of added) {
		const hasFields = result.some((field) => field.startsWith(`${key}.`));

		if (hasFields) {
			added.delete(key);
			continue;
		}

		const related = getRelatedCollection(schema, collection, key.split('.'))!;
		result.push(`${key}.${schema.collections[related]!.primary}`);
	}

	return {
		fields: result,
		systemFields: new Map([...systemFields].map(([key, keys]) => [key, [...keys]])),
		added,
	};
}

/**
 * Mark the m2o, o2m and a2o nodes of a versioned read as versioned, which reads them from the combined rows of their
 * collection as well
 */
export function annotateVersionedNodes(
	ast: AST,
	root: ReturnType<typeof splitVersionedQuery>,
	fields: ReturnType<typeof splitVersionFields>,
	context: Context,
) {
	const { versioning } = getHelpers(context.knex);
	const versionFields = new Map<AstLevel, string[]>();

	for (const level of getAstLevels(ast)) {
		if (!level.parent) {
			level.versioning = { ...root.versioning, fields: fields.systemFields.get('') ?? [], reference: null };
			versionFields.set(level, root.versionFields);
			continue;
		}

		const key = level.path.join('.');
		const node = level.node as NestedCollectionNode;
		const split = splitVersionedQuery(level.collection, level.query, context);
		const reference = versioning.getVersionReferenceField(node.relation.field);

		// The parent holds the references of m2o and a2o nodes, the related rows the ones of o2m nodes
		const referenceColumns = node.type === 'o2m' ? split.versionFields : versionFields.get(level.parent)!;

		level.query = split.query;

		if (fields.added.has(key)) level.children = [];

		level.versioning = {
			...split.versioning,
			fields: fields.systemFields.get(key) ?? [],
			reference: referenceColumns.includes(reference) ? reference : null,
		};

		versionFields.set(level, split.versionFields);
	}
}
