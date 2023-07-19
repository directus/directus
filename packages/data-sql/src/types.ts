/**
 * Here are type declared, which form a abstract query which is closer to SQL.
 *
 * @module
 */

import type { AbstractQueryNodeSortTargets } from '@directus/data';
import type { GeoJSONGeometry } from 'wellknown';

export interface AbstractSqlQueryColumn {
	table: string;
	column: string;
}

export interface AbstractSqlQuerySelectNode extends AbstractSqlQueryColumn {
	type: 'primitive';

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;
}

export interface AbstractSqlQueryFnNode {
	type: 'fn';

	/* Same as the the abstract functions @todo: add restrictions */
	fn: string;

	field: AbstractSqlQuerySelectNode;

	isTimestampType?: boolean;

	/* Indexes of additional arguments within the parameter list  */
	arguments?: ValuesNode;

	/* This can only be applied when using the function it within the SELECT clause */
	as?: string;
}

/** @TODO */
// export interface SqlStatementSelectJson {
// 	type: 'json';
// 	table: string;
// 	column: string;
// 	as?: string;
// 	path: string;
// }

/**
 * Used for parameterized queries.
 */
type ParameterIndex = {
	/** Indicates where the actual value is stored in the parameter array */
	parameterIndex: number;
};

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
	limit?: ParameterIndex;
	offset?: ParameterIndex;
	order?: AbstractSqlQueryOrderNode[];
	where?: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
	parameters: ParameterTypes[];
	/**
	 * SQL returns data as a flat object. This map contains the flat property names and the JSON path
	 * they correspond to.
	 */
	paths: Map<string, string[]>;
}

export type ParameterTypes = string | boolean | number | GeoJSONGeometry;

/**
 * All nodes which can be used within the `nodes` array of the `AbstractQuery` have a type attribute.
 * With this in place it can easily be determined how to technically handle this field.
 * @see `AbstractQueryNodeType` for all possible types.
 */
interface AbstractSqlQueryNode {
	/** the type of the node */
	type: string;
}

export interface AbstractSqlQueryOrderNode extends AbstractSqlQueryNode {
	type: 'order';
	orderBy: AbstractQueryNodeSortTargets;
	direction: 'ASC' | 'DESC';
}

export interface AbstractSqlQueryJoinNode extends AbstractSqlQueryNode {
	type: 'join';
	table: string;
	on: AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
	as: string;
}

export interface AbstractSqlQueryConditionNode {
	type: 'condition';
	condition:
		| SqlLetterConditionNode
		| SqlNumberConditionNode
		| SqlGeoConditionNode
		| SqlSetConditionNode
		| SqlFieldConditionNode
		| SqlBetweenCondition;
	negate: boolean;
}

export interface SqlLetterConditionNode {
	type: 'letter-condition';
	target: AbstractSqlQuerySelectNode;
	operation: 'contains' | 'starts_with' | 'ends_with' | 'eq';
	compareTo: ValueNode;
}

export interface SqlNumberConditionNode {
	type: 'number-condition';
	target: AbstractSqlQuerySelectNode | AbstractSqlQueryFnNode;
	operation: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
	compareTo: ValueNode;
}

export interface SqlBetweenCondition {
	type: 'between-condition';
	target: AbstractSqlQuerySelectNode;
	operation: 'between';
	compareTo: {
		type: 'values';
		parameterIndexes: [number, number];
	};
}

export interface SqlGeoConditionNode {
	type: 'geo-condition';
	target: AbstractSqlQuerySelectNode;
	operation: 'intersects' | 'intersects_bbox';
	compareTo: ValueNode;
}

// remove set here - sub query it's a thing that the driver should take care of
export interface SqlSetConditionNode {
	type: 'set-condition';
	operation: 'in';
	target: AbstractSqlQuerySelectNode;
	compareTo: ValuesNode;
}

export interface SqlFieldConditionNode {
	type: 'field-condition';
	operation: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
	target: AbstractSqlQuerySelectNode;
	compareTo: AbstractSqlQuerySelectNode;
}

export type CompareToNodeTypes = ValueNode | AbstractSqlQuerySelectNode | AbstractSqlQuery;

export interface AbstractSqlQueryLogicalNode extends AbstractSqlQueryNode {
	type: 'logical';
	operator: 'and' | 'or';
	negate: boolean;
	childNodes: (AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode)[];
}

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
