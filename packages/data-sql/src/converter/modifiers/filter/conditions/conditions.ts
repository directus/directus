import type { AbstractQueryConditionNode } from '@directus/data';
import type { WhereUnion } from '../../../../types/index.js';
import { convertFieldCondition } from './field.js';
import { convertGeoCondition } from './geo.js';
import { convertStringNode } from './string.js';
import { convertNumberNode } from './number.js';
import { convertSetCondition } from './set.js';

/**
 * Forward the condition to the correct converter.
 */
export function convertCondition(
	condition: AbstractQueryConditionNode,
	collection: string,
	generator: Generator<number, number, number>,
	negate: boolean
): WhereUnion {
	switch (condition.condition.type) {
		case 'condition-string':
			return convertStringNode(condition.condition, collection, generator, negate);
		case 'condition-number':
			return convertNumberNode(condition.condition, collection, generator, negate);
		case 'condition-geo-intersects':
		case 'condition-geo-intersects-bbox':
			return convertGeoCondition(condition.condition, collection, generator, negate);
		case 'condition-set':
			return convertSetCondition(condition.condition, collection, generator, negate);
		case 'condition-field':
			return convertFieldCondition(condition.condition, collection, negate);
	}
}
