import { ClientFilterOperator, Type } from '../types';

export function getFilterOperatorsForType(type: Type): ClientFilterOperator[] {
	switch (type) {
		// Text
		case 'binary':
		case 'json':
		case 'hash':
		case 'string':
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
		case 'uuid':
			return ['eq', 'neq', 'empty', 'nempty', 'in', 'nin'];

		// Boolean
		case 'boolean':
			return ['eq', 'neq', 'empty', 'nempty'];

		// Numbers
		case 'integer':
		case 'decimal':
			return ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'empty', 'nempty', 'in', 'nin'];

		// Datetime
		case 'dateTime':
		case 'date':
		case 'time':
			return ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'empty', 'nempty', 'in', 'nin'];

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
				'in',
				'nin',
			];
	}
}
