import {
	GraphQLBoolean,
	GraphQLFloat,
	GraphQLInt,
	GraphQLScalarType,
	GraphQLString,
	GraphQLList,
	GraphQLType,
} from 'graphql';
import { GraphQLJSON } from 'graphql-compose';
import { GraphQLDate, GraphQLGeoJSON } from '../services/graphql';
import { Type } from '@directus/shared/types';

export function getGraphQLType(localType: Type | 'alias' | 'unknown'): GraphQLScalarType | GraphQLList<GraphQLType> {
	switch (localType) {
		case 'boolean':
			return GraphQLBoolean;
		case 'bigInteger':
			return GraphQLString;
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
		default:
			return GraphQLString;
	}
}
