/**
 * A set of types which form the abstract SQL query.
 * It's still neutral to concrete SQL dialects and databases but provides to SQL drivers with a query type that they can more easy work with.
 *
 * The major differences between the abstract query and the SQL query are:
 * - Abstract relationships are converted into actual JOINs.
 * - Explicit values which are provided in the abstract query are added to a list of parameters in the abstract SQL query to prevent SQL injection.
 *
 * @remarks
 * Besides the different syntax of each SQL dialect, it's also important to mention that SQL databases vary regarding the technique to use to receive data.
 * For example, for some drivers it's be more efficient to use sub queries, for others it's better to use JOINs.
 *
 * @module
 */
import type { GeoJSONGeometry } from 'wellknown';
import type {
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryLogicalNode,
	AbstractSqlQueryOrderNode,
} from './modifiers/index.js';
import type { AbstractSqlQueryFnNode, AbstractSqlQueryJoinNode, AbstractSqlQuerySelectNode } from './nodes.js';

/**
 * This is an abstract SQL query which can be passed to all SQL drivers.
 *
 * @example
 * ```ts
 * const query: SqlStatement = {
 *  select: [id],
 *  from: 'articles',
 *  limit: 0,
 * 	parameters: [25],
 * };
 * ```
 */
export interface AbstractSqlQuery {
	select: (AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode)[];
	from: string;
	join?: AbstractSqlQueryJoinNode[];
	limit?: ValueNode;
	offset?: ValueNode;
	order?: AbstractSqlQueryOrderNode[];
	where?: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
	parameters: ParameterTypes[];
	/**
	 * SQL returns data as a flat object. This map contains the flat property names and the JSON path
	 * they correspond to.
	 */
	paths: Map<string, string[]>;
}

/**
 * All nodes which can be used within the `nodes` array of the `AbstractQuery` have a type attribute.
 * With this in place it can easily be determined how to technically handle this field.
 */
export interface AbstractSqlQueryNode {
	/** the type of the node */
	type: string;
}

/** @TODO */
// export interface SqlStatementSelectJson {
// 	type: 'json';
// 	table: string;
// 	column: string;
// 	as?: string;
// 	path: string;
// }

export type ParameterTypes = string | boolean | number | GeoJSONGeometry;

/**
 * Used pass a single value.
 */
export interface ValueNode extends AbstractSqlQueryNode {
	type: 'value';
	parameterIndex: number;
}

/**
 * Used pass an arbitrary amount of values.
 */
export interface ValuesNode extends AbstractSqlQueryNode {
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

export * from './nodes.js';
export * from './modifiers/index.js';
