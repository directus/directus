import { VALID_FILTER_OPERATORS } from '../constants';

export function isValidFilterOperator(name: string): boolean {
	if (!name.startsWith('_')) return false;
	const filterName = name.substring(1);
	// strange typing to allow for array.includes() on readonly without errors
	const filters = VALID_FILTER_OPERATORS as unknown as string[];
	return filters.includes(filterName);
}
