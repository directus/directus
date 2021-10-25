import { ClientFilterOperator, Type } from '../types';

export function getFilterOperatorsForType(type: Type): ClientFilterOperator[] {
	switch (type) {
		// Text
		case 'binary':
		case 'hash':
		case 'string':
		case 'csv':
			return [
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
			];

		// JSON
		// UUID
		case 'uuid':
			return ['eq', 'neq', 'null', 'nnull', 'in', 'nin'];
		case 'json':
			return ['null', 'nnull'];

		// Boolean
		case 'boolean':
			return ['eq', 'neq', 'null', 'nnull'];

		// Numbers
		case 'bigInteger':
		case 'integer':
		case 'decimal':
		case 'float':
			return ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'null', 'nnull', 'in', 'nin'];

		// Datetime
		case 'dateTime':
		case 'date':
		case 'time':
			return [
				'eq',
				'neq',
				'null',
				'nnull',
				'lt',
				'lte',
				'gt',
				'gte',
				'between',
				'nbetween',
				'null',
				'nnull',
				'in',
				'nin',
			];

		case 'geometry':
			return ['null', 'nnull', 'intersects', 'nintersects', 'intersects_bbox', 'nintersects_bbox'];

		default:
			return [
				'contains',
				'ncontains',
				'eq',
				'neq',
				'lt',
				'lte',
				'gt',
				'gte',
				'between',
				'nbetween',
				'empty',
				'nempty',
				'null',
				'nnull',
				'in',
				'nin',
			];
	}
}
