import type { AbstractQueryFunction } from '../common/function.js';
import type { AbstractQueryPrimitive } from '../common/primitive.js';
import type { AbstractQueryTargetNestedOne } from './target/nested.js';

export type AbstractQueryTarget = AbstractQueryPrimitive | AbstractQueryFunction | AbstractQueryTargetNestedOne;
