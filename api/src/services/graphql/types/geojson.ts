import { GraphQLScalarType } from 'graphql';
import { GraphQLJSON } from 'graphql-compose';

export const GraphQLGeoJSON = new GraphQLScalarType({
	...GraphQLJSON,
	name: 'GraphQLGeoJSON',
	description: 'GeoJSON value',
});
