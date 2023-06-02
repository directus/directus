import { PostgresStatement } from './statement.js';
import type { AbstractQuery, AbstractQueryFieldNodePrimitive, ParameterizedQuery } from '@directus/data/types';

/**
 * Generate the SQL equivalent for the given abstract query.
 * To prevent SQL injection the identifiers are escaped.
 * Values f.e. for filtering will soon be added and passed as parameters to the database.
 * Have a look into the {@link https://www.postgresql.org/docs/15/plpgsql-statements.html#PLPGSQL-STATEMENTS-EXECUTING-DYN | PostgreSQL documentation } for more about safe dynamic queries.
 * So far only a very simple query is supported, like `SELECT x, y FROM z`.
 *
 * @param query - the abstract query
 * @returns An SQL query
 */
export function constructSQLQuery(query: AbstractQuery): ParameterizedQuery {
	const statement = new PostgresStatement(query.collection);

	const primitives = query.nodes.filter((n) => n.type === 'primitive') as AbstractQueryFieldNodePrimitive[];
	statement.addSelect(primitives);

	return statement.toParameterizedQuery();
}
