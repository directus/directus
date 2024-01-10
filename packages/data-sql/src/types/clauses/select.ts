import type { AbstractSqlQuerySelectFnNode } from './select/fn.js';
import type { AbstractSqlQuerySelectPrimitiveNode } from './select/primitive.js';

export type AbstractSqlQuerySelectNode = AbstractSqlQuerySelectPrimitiveNode | AbstractSqlQuerySelectFnNode;
