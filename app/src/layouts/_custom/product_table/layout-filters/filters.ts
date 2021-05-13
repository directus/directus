import { Filter } from '@/types';

export function createStatusFilter(value: string) {
	const filter: Filter = {
		field: 'status',
		key: 'status',
		operator: 'eq',
		value,
	};

	return createFilter(filter);
}

export function createCategoryFilter(value: string) {
	const filter: Filter = {
		key: 'category',
		field: 'category.id',
		operator: 'eq',
		value,
	};

	return createFilter(filter);
}

function createFilter(filter: Filter): Filter {
	console.log('Creating filter:', filter);
	return filter;
}
