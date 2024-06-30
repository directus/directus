import type { Relation, SchemaOverview } from '@directus/types';
import { useLogger } from '../../../logger.js';

/**
 * Regex was taken from the spec
 * https://spec.graphql.org/June2018/#sec-Names
 */
const GRAPHQL_NAME_REGEX = /^[_A-Za-z][_0-9A-Za-z]*$/;

/**
 * Manually curated list of GraphQL reserved names to cover the most likely naming footguns.
 * This list is not exhaustive and does not cover generated type names.
 */
const GRAPHQL_RESERVED_NAMES = [
	'Subscription',
	'Query',
	'Mutation',
	'Int',
	'Float',
	'String',
	'Boolean',
	'DateTime',
	'ID',
	'uid',
	'Point',
	'PointList',
	'Polygon',
	'MultiPolygon',
	'JSON',
	'Hash',
	'Date',
	'Void',
];

/**
 * Filters out invalid collections to prevent graphql from errorring on schema generation
 *
 * @param schema
 * @returns sanitized schema
 */
export function sanitizeGraphqlSchema(schema: SchemaOverview) {
	const logger = useLogger();

	const collections = Object.entries(schema.collections).filter(([collectionName, _data]) => {
		// double underscore __ is reserved for GraphQL introspection
		if (collectionName.startsWith('__') || !collectionName.match(GRAPHQL_NAME_REGEX)) {
			logger.warn(
				`GraphQL skipping collection "${collectionName}" because it is not a valid name matching /^[_A-Za-z][_0-9A-Za-z]*$/ or starts with __`,
			);

			return false;
		}

		if (GRAPHQL_RESERVED_NAMES.includes(collectionName)) {
			logger.warn(`GraphQL skipping collection "${collectionName}" because it is a reserved keyword`);

			return false;
		}

		return true;
	});

	schema.collections = Object.fromEntries(collections);

	const collectionExists = (collection: string) => Boolean(schema.collections[collection]);

	const skipRelation = (relation: Relation) => {
		const relationName = relation.schema?.constraint_name ?? `${relation.collection}.${relation.field}`;

		logger.warn(
			`GraphQL skipping relation "${relationName}" because it links to a non-existent or invalid collection.`,
		);

		return false;
	};

	schema.relations = schema.relations.filter((relation) => {
		if (relation.collection && !collectionExists(relation.collection)) {
			return skipRelation(relation);
		}

		if (relation.related_collection && !collectionExists(relation.related_collection)) {
			return skipRelation(relation);
		}

		if (relation.meta) {
			if (relation.meta.many_collection && !collectionExists(relation.meta.many_collection)) {
				return skipRelation(relation);
			}

			if (relation.meta.one_collection && !collectionExists(relation.meta.one_collection)) {
				return skipRelation(relation);
			}

			if (
				relation.meta.one_allowed_collections &&
				relation.meta.one_allowed_collections.some((allowed_collection) => !collectionExists(allowed_collection))
			) {
				return skipRelation(relation);
			}
		}

		return true;
	});

	return schema;
}
