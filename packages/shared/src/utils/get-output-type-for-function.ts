import { ApiFunction, Type } from '../types/fields';

export function getOutputTypeForFunction(fn: ApiFunction): Type {
	const typeMap: Record<ApiFunction, Type> = {
		year: 'integer',
		month: 'integer',
		week: 'integer',
		day: 'integer',
		weekday: 'integer',
		hour: 'integer',
		minute: 'integer',
		second: 'integer',
		count: 'integer',
	};

	return typeMap[fn];
}
