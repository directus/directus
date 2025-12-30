import type { AST } from '../../types/ast.js';
import type { Knex } from 'knex';

export interface RunASTOptions {
	/**
	 * Query override for the current level
	 */
	query?: AST['query'];

	/**
	 * Knex instance
	 */
	knex?: Knex;

	/**
	 * Whether or not the current execution is a nested dataset in another AST
	 */
	nested?: boolean;

	/**
	 * Whether or not to strip out non-requested required fields automatically (eg IDs / FKs)
	 */
	stripNonRequested?: boolean;
}
