import type { AbstractSqlQueryFnNode } from './function.js';
import type { AbstractSqlQueryJsonNode } from './json.js';
import type { AbstractSqlQueryPrimitiveNode } from './primitive.js';

export type AbstractSqlQueryTargetNode =
	| AbstractSqlQueryPrimitiveNode
	| AbstractSqlQueryFnNode
	| AbstractSqlQueryJsonNode;
