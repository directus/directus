import type { Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getHelpers } from '../database/helpers/index.js';
import type { VersionedAST, VersionReadMode } from '../types/ast.js';
import { getEngineFields, isSystemField, mapAggregate, rewriteSort, toSystemColumn } from './fields.js';
import { rewriteFilter, stripSystemFilter } from './filter.js';
import { createVirtualCollection } from './virtual-collection.js';

/**
 * Whether the query asks for versions, using `version=true`
 */
export function isVersionedQuery(query: Query) {
	return String(query.version) === 'true';
}

/**
 * Split a query on a versioned collection into the query on the live collection, which permissions are validated against,
 * and the parts that apply to the combined rows of live items and versions. Fields, filters and sorts on the version system
 * fields use the `directus_version.<key>` format.
 */
export function parseVersionedQuery(
	collection: string,
	query: Query,
	mode: VersionReadMode,
	context: { knex: Knex; schema: SchemaOverview },
): { query: Query; versioning: VersionedAST } {
	const { knex, schema } = context;
	const { versioning } = getHelpers(knex);
	const isAggregate = Boolean(query.group || Object.keys(query.aggregate ?? {}).length > 0);
	const fields = query.fields ?? ['*'];
	const engineFields = getEngineFields(schema, collection, fields);

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

	const virtual = createVirtualCollection(knex, schema, collection, mode);

	// Filters on versions of related items require access to them as well
	const shadows = new Set([versioning.getShadowTableName(collection)]);

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

	return {
		query: liveQuery,
		versioning: {
			collection,
			mode,
			fields,
			query: {
				filter,
				sort: query.sort?.map(rewriteSort) ?? null,
				...(query.group ? { group: query.group.map(toSystemColumn) } : {}),
				...(query.aggregate
					? { aggregate: mapAggregate(query.aggregate, (fields) => fields.map(toSystemColumn)) }
					: {}),
			},
			select: isAggregate ? (query.group ?? []).filter(isSystemField).map(toSystemColumn) : virtual.versionFields,
			added: engineFields.added,
			shadows: [...shadows],
		},
	};
}
