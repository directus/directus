import { Type, ApiFunction } from '../types/fields';

export function getFunctionsForType(type: Type): ApiFunction[] {
	switch (type) {
		case 'dateTime':
		case 'timestamp':
			return ['year', 'month', 'week', 'day', 'weekday', 'hour', 'minute', 'second'];
		case 'date':
			return ['year', 'month', 'week', 'day', 'weekday'];
		case 'time':
			return ['hour', 'minute', 'second'];
		case 'json':
			return ['count'];
		default:
			return [];
	}
}
