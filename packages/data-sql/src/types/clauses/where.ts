import type { AbstractSqlQueryConditionNode } from './where/conditions.js';
import type { AbstractSqlQueryLogicalNode } from './where/logical.js';

export type AbstractSqlQueryWhereNode = AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
