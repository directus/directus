import { FieldFunction, Type } from '../types/fields';

export function getOutputTypeForFunction(fn: FieldFunction): Type {
	const typeMap: Record<FieldFunction, Type> = {
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
