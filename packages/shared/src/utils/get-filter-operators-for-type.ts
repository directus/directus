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
				'in',
				'nin',
			];

		// JSON
		case 'json':
			return ['eq', 'neq', 'null', 'nnull', 'in', 'nin'];

		// UUID
		case 'uuid':
			return ['eq', 'neq', 'null', 'nnull', 'in', 'nin'];

		// Boolean
		case 'boolean':
			return ['eq', 'neq', 'null', 'nnull'];

		// Numbers
		case 'integer':
		case 'decimal':
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
			return ['eq', 'neq', 'intersects', 'nintersects', 'intersects_bbox', 'nintersects_bbox'];

		default:
			return [
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
			];
	}
}
