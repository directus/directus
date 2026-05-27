import { GraphQLScalarType, GraphQLString } from 'graphql';

export const GraphQLDate = new GraphQLScalarType({
	...GraphQLString,
	name: 'Date',
	description: 'ISO8601 Date values',
});
