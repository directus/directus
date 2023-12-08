import type { AbstractQueryConditionNode } from '@directus/data';
import type { IndexGenerators } from '../../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertFieldCondition } from './field.js';
import { convertGeoCondition } from './geo.js';
import { convertNumberNode } from './number.js';
import { convertSetCondition } from './set.js';
import { convertStringNode } from './string.js';

/**
 * Forward the condition to the correct converter.
 */
export function convertCondition(
	condition: AbstractQueryConditionNode,
	collection: string,
	indexGen: IndexGenerators,
	negate: boolean,
): FilterResult {
	switch (condition.condition.type) {
		case 'condition-string':
			return convertStringNode(condition.condition, collection, indexGen, negate);
		case 'condition-number':
			return convertNumberNode(condition.condition, collection, indexGen, negate);
		case 'condition-geo-intersects':
		case 'condition-geo-intersects-bbox':
			return convertGeoCondition(condition.condition, collection, indexGen, negate);
		case 'condition-set':
			return convertSetCondition(condition.condition, collection, indexGen, negate);
		case 'condition-field':
			return convertFieldCondition(condition.condition, collection, indexGen, negate);
	}
}
