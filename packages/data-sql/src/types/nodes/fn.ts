import type { AbstractSqlQuerySelectNode } from './primitive.js';
import type { ValuesNode } from '../parameterized-statement.js';
import type { SupportedFunctions } from '@directus/data';

/**
 * Used to apply a function to a column.
 * Currently we support various EXTRACT functions to extract specific parts out of a data/time value.
 */
export interface AbstractSqlQueryFnNode {
	type: 'fn';

	/**
	 * A list of supported functions. Those are the same as the abstract query.
	 */
	fn: SupportedFunctions;

	/**
	 * The column to which the function should be applied.
	 */
	field: AbstractSqlQuerySelectNode;

	/*
	 * Indicated if a column is of type TIMESTAMP.
	 * It's used to let the database parse the column properly.
	 */
	isTimestampType?: boolean;

	/*
	 * Used to specify additional arguments.
	 * Same as will all user input, the arguments are passed via parameters.
	 */
	arguments?: ValuesNode;

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;

	alias?: string;
}
