import type { AbstractSqlQueryConditionNode } from './where/condition.js';
import type { AbstractSqlQueryLogicalNode } from './where/logical.js';

export type AbstractSqlQueryWhereNode = AbstractSqlQueryConditionNode | AbstractSqlQueryLogicalNode;
