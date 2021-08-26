import { OperatorType } from './types';
import { Type } from '@directus/shared/types';

export default function getAvailableOperatorsForType(type: Type): OperatorType {
	/**
	 * @NOTE
	 * In the filter, you can't filter on the relational field itself, so we don't have to account
	 * for fields like m2o / file / etc
	 */

	switch (type) {
		// Text
		case 'binary':
		case 'hash':
		case 'string':
			return {
				type,
				operators: [
					'contains',
					'ncontains',
					'starts_with',
					'nstarts_with',
					'ends_with',
					'nends_with',
					'eq',
					'neq',
					'empty',
					'nempty',
					'null',
					'nnull',
					'in',
					'nin',
				],
			};
		// JSON
		case 'json':
			return {
				type,
				operators: ['eq', 'neq', 'null', 'nnull', 'in', 'nin'],
			};
		// UUID
		case 'uuid':
			return {
				type,
				operators: ['eq', 'neq', 'null', 'nnull', 'in', 'nin'],
			};
		// Boolean
		case 'boolean':
			return {
				type,
				operators: ['eq', 'neq', 'null', 'nnull'],
			};
		// Numbers
		case 'integer':
		case 'decimal':
			return {
				type,
				operators: ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'null', 'nnull', 'in', 'nin'],
			};
		// Datetime
		case 'dateTime':
		case 'date':
		case 'time':
			return {
				type,
				operators: ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'null', 'nnull', 'in', 'nin'],
			};
		// Geometry
		case 'geometry':
			return {
				type,
				operators: ['eq', 'neq', 'null', 'nnull', 'intersects', 'nintersects', 'intersects_bbox', 'nintersects_bbox'],
			};
		default:
			return {
				type,
				operators: [
					'eq',
					'neq',
					'lt',
					'lte',
					'gt',
					'gte',
					'contains',
					'ncontains',
					'between',
					'nbetween',
					'empty',
					'nempty',
					'null',
					'nnull',
					'in',
					'nin',
				],
			};
	}
}
