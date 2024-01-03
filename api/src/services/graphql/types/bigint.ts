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
	// Attempt to parse the input as a regular integer
	const intValue = Number(input);

	if (isNaN(intValue)) {
		throw new Error('Invalid GraphQLBigInt');
	}

	if (!Number.isSafeInteger(intValue)) {
		// If the input is not a safe integer, its a big int, so return it as string,
		// because currently string is the best way to handle big int due to knex limitations and JSON.stringify not able to serialise bigInt

		const minVal = -1n * 2n ** 63n;
		const maxVal = 2n ** 63n - 1n;

		const bigIntInput = BigInt(input);

		if (bigIntInput < minVal || bigIntInput > maxVal) {
			throw new Error('Invalid GraphQLBigInt');
		}

		return input;
	}

	return intValue;
}
