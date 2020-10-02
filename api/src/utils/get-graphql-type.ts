import { GraphQLBoolean, GraphQLFloat, GraphQLInt, GraphQLString } from 'graphql';
import { types } from '../types';

export function getGraphQLType(localType: typeof types[number]) {
	switch (localType) {
		case 'boolean':
			return GraphQLBoolean;
		case 'bigInteger':
		case 'integer':
			return GraphQLInt;
		case 'decimal':
		case 'float':
			return GraphQLFloat;
		default:
			return GraphQLString;
	}
}
