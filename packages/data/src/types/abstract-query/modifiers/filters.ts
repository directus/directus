import type { AbstractQueryConditionNode } from './filters/conditions.js';
import type { AbstractQueryNodeLogical } from './filters/logical.js';
import type { AbstractQueryNodeNegate } from './filters/negate.js';
import type { AbstractQueryNodeQuantifier } from './filters/quantifier.js';
import type { AbstractQueryTarget } from './target.js';

export type AbstractQueryFilterNode<Target = AbstractQueryTarget> =
	| AbstractQueryConditionNode<Target>
	| AbstractQueryNodeLogical<Target>
	| AbstractQueryNodeQuantifier<Target>
	| AbstractQueryNodeNegate<Target>;
