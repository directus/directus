import { VALID_FILTER_OPERATORS } from '../constants';

export function isValidFilter(name: string): boolean {
	if (!name.startsWith('_')) return false;
	const filterName = name.substring(1);
	return filterName in VALID_FILTER_OPERATORS;
}
