import { GraphQLScalarType, Kind } from 'graphql';

export const GraphQLBigInt = new GraphQLScalarType({
	name: 'GraphQLBigInt',
	description: 'BigInt value',
	serialize(value) {
		if (!value) return value;
		if (typeof value === 'string') return value;
		if (typeof value !== 'number') {
			throw new Error('Value must be a Number');
		}

		return value.toString();
	},
	parseValue(value) {
		if (typeof value !== 'string') {
			throw new Error('Value must be a String');
		}

		return parseNumberValue(value);
	},
	parseLiteral(ast) {
		if (ast.kind !== Kind.STRING) {
			throw new Error('Value must be a String');
		}

		return parseNumberValue(ast.value);
	},
});

function parseNumberValue(input: string) {
	if (!/[+-]?([0-9]+[.])?[0-9]+/.test(input)) return input;

	const value = parseInt(input);

	if (isNaN(value) || value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
		throw new Error('Invalid GraphQLBigInt');
	}

	return value;
}
