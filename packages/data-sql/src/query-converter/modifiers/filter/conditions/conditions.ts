import type { AbstractQueryConditionNode } from '@directus/data';
import type { IndexGenerators } from '../../../utils/create-index-generators.js';
import type { FilterResult } from '../utils.js';
import { convertFieldCondition } from './field.js';
import { convertGeoCondition } from './geo.js';
import { convertNumberNode } from './number.js';
import { convertSetNumberCondition } from './set-number.js';
import { convertSetStringCondition } from './set-string.js';
import { convertStringNode } from './string.js';

/**
 * Forward the condition to the correct converter.
 */
export function convertCondition(
	condition: AbstractQueryConditionNode,
	tableIndex: number,
	indexGen: IndexGenerators,
	negate: boolean,
): FilterResult {
	switch (condition.condition.type) {
		case 'condition-string':
			return convertStringNode(condition.condition, tableIndex, indexGen, negate);
		case 'condition-number':
			return convertNumberNode(condition.condition, tableIndex, indexGen, negate);
		case 'condition-geo-intersects':
		case 'condition-geo-intersects-bbox':
			return convertGeoCondition(condition.condition, tableIndex, indexGen, negate);
		case 'condition-set-number':
			return convertSetNumberCondition(condition.condition, tableIndex, indexGen, negate);
		case 'condition-set-string':
			return convertSetStringCondition(condition.condition, tableIndex, indexGen, negate);
		case 'condition-field':
			return convertFieldCondition(condition.condition, tableIndex, indexGen, negate);
	}
}
