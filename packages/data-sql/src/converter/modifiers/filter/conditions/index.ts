import type { AbstractQueryConditionNode } from '@directus/data';
import type { AbstractSqlQuery } from '../../../../types.js';
import { convertFieldCondition } from './field.js';
import { convertGeoCondition } from './geo.js';
import { convertLetterNode } from './letter.js';
import { convertNumberNode } from './number.js';
import { convertSetCondition } from './set.js';

export function convertCondition(
	condition: AbstractQueryConditionNode,
	collection: string,
	generator: Generator<number, never, never>,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> {
	switch (condition.condition.type) {
		case 'condition-letter':
			return convertLetterNode(condition.condition, collection, generator, negate);
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
