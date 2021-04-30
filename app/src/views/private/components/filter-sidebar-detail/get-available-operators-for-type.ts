import { OperatorType } from './types';

export default function getAvailableOperatorsForType(type: string): OperatorType {
	/**
	 * @NOTE
	 * In the filter, you can't filter on the relational field itself, so we don't have to account
	 * for fields like m2o / file / etc
	 */

	switch (type) {
		// Text
		case 'binary':
		case 'json':
		case 'array':
		case 'status':
		case 'slug':
		case 'lang':
		case 'uuid':
		case 'hash':
		case 'string':
			return {
				type: 'text',
				operators: ['contains', 'ncontains', 'eq', 'neq', 'empty', 'nempty', 'in', 'nin'],
			};
		// Boolean
		case 'boolean':
			return {
				type: 'checkbox',
				operators: ['eq', 'empty', 'nempty'],
			};
		// Numbers
		case 'integer':
		case 'decimal':
		case 'sort':
			return {
				type: 'number',
				operators: ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'empty', 'nempty', 'in', 'nin'],
			};
		// Datetime
		case 'datetime':
		case 'date':
		case 'time':
		case 'datetime_created':
		case 'datetime_updated':
			return {
				type: 'datetime',
				operators: ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'empty', 'nempty', 'in', 'nin'],
			};
		default:
			return {
				type: 'unknown',
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
					'in',
					'nin',
				],
			};
	}
}
