import type { Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getHelpers } from '../database/helpers/index.js';
import { VERSION_FIELD, VERSION_SYSTEM_FIELDS } from '../services/version-tables/constants.js';
import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode, VersionedNode } from '../types/ast.js';
import {
	getRelatedCollection,
	getSystemColumn,
	isSystemField,
	mapAggregate,
	rewriteSort,
	toSystemColumn,
} from './fields.js';
import { rewriteFilter, stripSystemFilter } from './filter.js';
import { createVirtualCollection } from './virtual-collection.js';

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

	const virtual = createVirtualCollection(knex, schema, collection);
	const shadows = new Set<string>();

	if (schema.collections[collection]?.versioned) shadows.add(versioning.getShadowTableName(collection));

	// Filters on versions of related items require access to them as well
	const filter = query.filter
		? rewriteFilter(query.filter, {
				schema: virtual.schema,
				versioning,
				collection: virtual.name,
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
		shadows: [...shadows],
	};

	return { query: liveQuery, versioning: versioned, versionFields: virtual.versionFields };
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

		// Version system fields of a2o related items aren't supported
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
 * Mark the m2o and o2m nodes of a versioned read as versioned, which reads them from the combined rows of their
 * collection as well. Relations of a2o nodes only read live items.
 */
export function annotateVersionedNodes(
	ast: AST,
	root: ReturnType<typeof splitVersionedQuery>,
	fields: ReturnType<typeof splitVersionFields>,
	context: Context,
) {
	ast.versioning = { ...root.versioning, fields: fields.systemFields.get('') ?? [], reference: null };

	annotateChildren(ast.children, root.versionFields, [], fields, context);
}

function annotateChildren(
	children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[],
	parentVersionFields: string[],
	path: string[],
	fields: ReturnType<typeof splitVersionFields>,
	context: Context,
) {
	const { versioning } = getHelpers(context.knex);

	for (const child of children) {
		if (child.type !== 'm2o' && child.type !== 'o2m') continue;

		const childPath = [...path, child.fieldKey];
		const key = childPath.join('.');
		const split = splitVersionedQuery(child.name, child.query, context);
		const reference = versioning.getVersionReferenceField(child.relation.field);
		const referenceColumns = child.type === 'm2o' ? parentVersionFields : split.versionFields;

		child.query = split.query;

		if (fields.added.has(key)) child.children = [];

		child.versioning = {
			...split.versioning,
			fields: fields.systemFields.get(key) ?? [],
			reference: referenceColumns.includes(reference) ? reference : null,
		};

		annotateChildren(child.children, split.versionFields, childPath, fields, context);
	}
}
