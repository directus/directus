import { GraphQLString, GraphQLScalarType } from 'graphql';

export const GraphQLHash = new GraphQLScalarType({
	...GraphQLString,
	name: 'Hash',
	description: 'Hashed string values',
});
