import { GraphQLScalarType, Kind } from 'graphql';

/**
 * Adopted from https://kamranicus.com/handling-multiple-scalar-types-in-graphql/
 */

export const GraphQLStringOrFloat = new GraphQLScalarType({
	name: 'GraphQLStringOrFloat',
	description: 'A Float or a String',
	serialize(value) {
		if (typeof value !== 'string' && typeof value !== 'number') {
			throw new Error('Value must be either a String or a Float');
		}

		return value;
	},
	parseValue(value) {
		if (typeof value !== 'string' && typeof value !== 'number') {
			throw new Error('Value must be either a String or a Float');
		}

		return value;
	},
	parseLiteral(ast) {
		switch (ast.kind) {
			case Kind.INT:
			case Kind.FLOAT:
				return Number(ast.value);
			case Kind.STRING:
				return ast.value;
			default:
				throw new Error('Value must be either a String or a Float');
		}
	},
});
