import type { AbstractQueryConditionNode } from './filters/conditions.js';
import type { AbstractQueryNodeLogical } from './filters/logical.js';
import type { AbstractQueryNodeNegate } from './filters/negate.js';

export type AbstractQueryFilterNode = AbstractQueryConditionNode | AbstractQueryNodeLogical | AbstractQueryNodeNegate;
