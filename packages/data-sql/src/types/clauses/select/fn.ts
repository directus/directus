import type { ArrayFn, ExtractFn } from '@directus/data';
import type { ValuesNode } from '../../parameterized-statement.js';
import type { AbstractSqlQueryColumn } from './column.js';

/**
 * Used to apply a function to a column.
 * Currently we support various EXTRACT functions to extract specific parts out of a data/time value.
 */
export interface AbstractSqlQuerySelectFnNode extends AbstractSqlQueryColumn {
	type: 'fn';

	/**
	 * A list of supported functions. Those are the same as the abstract query.
	 */
	fn: ExtractFn | ArrayFn;

	/*
	 * Used to specify additional arguments.
	 * Same as will all user input, the arguments are passed via parameters.
	 */
	arguments?: ValuesNode;

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;
}
