import { OperatorType } from './types';
import { types } from '@/types';

export default function getAvailableOperatorsForType(type: typeof types[number]): OperatorType {
	/**
	 * @NOTE
	 * In the filter, you can't filter on the relational field itself, so we don't have to account
	 * for fields like m2o / file / etc
	 */

	switch (type) {
		// Text
		case 'binary':
		case 'json':
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
					'in',
					'nin',
				],
			};
		case 'uuid':
			return {
				type,
				operators: ['eq', 'neq', 'empty', 'nempty', 'in', 'nin'],
			};
		// Boolean
		case 'boolean':
			return {
				type,
				operators: ['eq', 'neq', 'empty', 'nempty'],
			};
		// Numbers
		case 'integer':
		case 'decimal':
			return {
				type,
				operators: ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'empty', 'nempty', 'in', 'nin'],
			};
		// Datetime
		case 'dateTime':
		case 'date':
		case 'time':
			return {
				type,
				operators: ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'empty', 'nempty', 'in', 'nin'],
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
					'in',
					'nin',
				],
			};
	}
}
