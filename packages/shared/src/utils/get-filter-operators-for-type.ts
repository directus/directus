import { ClientFilterOperator, Type } from '../types';

type GetFilterOperationsForTypeOptions = {
	includeValidation?: boolean;
};

export function getFilterOperatorsForType(
	type: Type,
	opts?: GetFilterOperationsForTypeOptions
): ClientFilterOperator[] {
	const validationOnlyStringFilterOperators: ClientFilterOperator[] = opts?.includeValidation ? ['regex'] : [];

	switch (type) {
		// Text
		case 'binary':
		case 'string':
		case 'text':
		case 'csv':
			return [
				'contains',
				'ncontains',
				'icontains',
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
				...validationOnlyStringFilterOperators,
			];
		// Hash
		case 'hash':
			return ['empty', 'nempty', 'null', 'nnull'];
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
			return ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between', 'nbetween', 'null', 'nnull', 'in', 'nin'];

		case 'geometry':
			return ['eq', 'neq', 'null', 'nnull', 'intersects', 'nintersects', 'intersects_bbox', 'nintersects_bbox'];

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
				...validationOnlyStringFilterOperators,
			];
	}
}
