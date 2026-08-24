import { GraphQLScalarType, type ValueNode } from 'graphql';
import { GraphQLJSON } from 'graphql-compose';

function validateJsonFilterValue(value: unknown): Record<string, Record<string, unknown>> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error('json filter value must be a plain object mapping JSON path keys to filter operators');
	}

	for (const [key, operatorObj] of Object.entries(value as Record<string, unknown>)) {
		if (key.trim().length === 0) {
			throw new Error('json filter: keys must not be empty');
		} else if (key === '_or' || key === '_and') {
			if (!Array.isArray(operatorObj)) {
				throw new Error(`json filter: "${key}" must be an array of filter objects`);
			}
		} else if (typeof operatorObj !== 'object' || operatorObj === null || Array.isArray(operatorObj)) {
			throw new Error(`json filter: "${key}" must be a filter operator object (e.g. { "_eq": "value" })`);
		}
	}

	return value as Record<string, Record<string, unknown>>;
}

/**
 * A scalar representing a JSON filter value: a plain object mapping JSON path keys
 * to filter operator objects (e.g. { "color": { "_eq": "red" }, "size": { "_gt": 5 } }).
 */
export const GraphQLJsonFilter = new GraphQLScalarType({
	...GraphQLJSON,
	name: 'GraphQLJsonFilter',
	description:
		'A JSON filter value: a plain object mapping JSON path keys to filter operators (e.g. { "key": { "_eq": "value" } })',
	parseValue(value: unknown) {
		return validateJsonFilterValue(value);
	},
	parseLiteral(ast: ValueNode, variables?: Record<string, unknown> | null) {
		const value = GraphQLJSON.parseLiteral!(ast, variables);
		return validateJsonFilterValue(value);
	},
});
