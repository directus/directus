import type { Type } from '@directus/shared/types';
import {
	GraphQLBoolean,
	GraphQLFloat,
	GraphQLInt,
	GraphQLList,
	GraphQLScalarType,
	GraphQLString,
	GraphQLType,
} from 'graphql';
import { GraphQLJSON } from 'graphql-compose';
import { GraphQLBigInt } from '../services/graphql/types/bigint';
import { GraphQLDate } from '../services/graphql/types/date';
import { GraphQLGeoJSON } from '../services/graphql/types/geojson';
import { GraphQLHash } from '../services/graphql/types/hash';

export function getGraphQLType(
	localType: Type | 'alias' | 'unknown',
	special: string[]
): GraphQLScalarType | GraphQLList<GraphQLType> {
	if (special.includes('conceal')) {
		return GraphQLHash;
	}

	switch (localType) {
		case 'boolean':
			return GraphQLBoolean;
		case 'bigInteger':
			return GraphQLBigInt;
		case 'integer':
			return GraphQLInt;
		case 'decimal':
		case 'float':
			return GraphQLFloat;
		case 'csv':
			return new GraphQLList(GraphQLString);
		case 'json':
			return GraphQLJSON;
		case 'geometry':
			return GraphQLGeoJSON;
		case 'timestamp':
		case 'dateTime':
		case 'date':
			return GraphQLDate;
		case 'hash':
			return GraphQLHash;
		default:
			return GraphQLString;
	}
}
