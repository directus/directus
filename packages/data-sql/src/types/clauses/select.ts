import type { AbstractSqlQuerySelectFnNode } from './select/function.js';
import type { AbstractSqlQuerySelectPrimitiveNode } from './select/primitive.js';

export type AbstractSqlQuerySelectNode = AbstractSqlQuerySelectPrimitiveNode | AbstractSqlQuerySelectFnNode;
