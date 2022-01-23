import { Request, Response } from 'express';
import { DocumentNode, GraphQLScalarType, GraphQLString } from 'graphql';
import { GraphQLJSON } from 'graphql-compose';

export interface GraphQLParams {
	query: string | null;
	variables: { readonly [name: string]: unknown } | null;
	operationName: string | null;
	document: DocumentNode;
	contextValue: {
		req?: Request;
		res?: Response;
	};
}

export const GraphQLVoid = new GraphQLScalarType({
	name: 'Void',

	description: 'Represents NULL values',

	serialize() {
		return null;
	},

	parseValue() {
		return null;
	},

	parseLiteral() {
		return null;
	},
});

export const GraphQLGeoJSON = new GraphQLScalarType({
	...GraphQLJSON,
	name: 'GraphQLGeoJSON',
	description: 'GeoJSON value',
});

export const GraphQLDate = new GraphQLScalarType({
	...GraphQLString,
	name: 'Date',
	description: 'ISO8601 Date values',
});
