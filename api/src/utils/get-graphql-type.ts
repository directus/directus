import { GraphQLBoolean, GraphQLFloat, GraphQLInt, GraphQLScalarType, GraphQLString } from 'graphql';
import { GraphQLJSON } from 'graphql-compose';
import { GraphQLDate } from '../services/graphql';
import { types } from '../types';

export function getGraphQLType(localType: typeof types[number] | 'alias' | 'unknown'): GraphQLScalarType {
	switch (localType) {
		case 'boolean':
			return GraphQLBoolean;
		case 'bigInteger':
		case 'integer':
			return GraphQLInt;
		case 'decimal':
		case 'float':
			return GraphQLFloat;
		case 'csv':
		case 'json':
			return GraphQLJSON;
		case 'timestamp':
		case 'dateTime':
		case 'date':
			return GraphQLDate;
		default:
			return GraphQLString;
	}
}
