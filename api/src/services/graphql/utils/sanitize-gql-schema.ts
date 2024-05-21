import type { SchemaOverview } from '@directus/types';
import { useLogger } from '../../../logger.js';

/**
 * Regex was taken from the spec
 * https://spec.graphql.org/June2018/#sec-Names
 */
const GRAPHQL_NAME_REGEX = /^[_A-Za-z][_0-9A-Za-z]*/;

// Not an exhaustive list (doesnt include generated names)
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
];

/**
 * Filters out invalid collections to prevent graphql from errorring on schema generation
 *
 * @param schema
 * @returns
 */
export function sanitizeGraphqlSchema(schema: SchemaOverview) {
	const logger = useLogger();

	const collections = Object.entries(schema.collections).filter(([collectionName, _data]) => {
		if (collectionName.startsWith('__') || !collectionName.match(GRAPHQL_NAME_REGEX)) {
			logger.warn(
				`GraphQL skipping collection "${collectionName}" because it is not a valid name matching /^[_A-Za-z][_0-9A-Za-z]*/`,
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

	return schema;
}
