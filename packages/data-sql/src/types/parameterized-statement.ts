import type { GeoJSONGeometry } from 'wellknown';

/**
 * Used pass a single value.
 */
export interface ValueNode {
	type: 'value';
	parameterIndex: number;
}

/**
 * Used pass an arbitrary amount of values.
 */
export interface ValuesNode {
	type: 'values';
	parameterIndexes: number[];
}

/**
 * An actual vendor specific SQL statement with its parameters.
 * @example
 * ```
 * {
 * 		statement: 'SELECT * FROM "articles" WHERE "articles"."id" = $1;',
 * 		values: [99],
 * }
 * ```
 */
export interface ParameterizedSqlStatement {
	statement: string;
	parameters: ParameterTypes[];
}

export type ParameterTypes = string | boolean | number | GeoJSONGeometry;
