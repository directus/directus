import { isPlainObject } from 'lodash-es';

export function getOperation(key: string, value: Record<string, any>): { operator: string; value: any } | null {
	if (key.startsWith('_') && !['_and', '_or', '_none', '_some'].includes(key)) {
		return { operator: key, value };
	} else if (!isPlainObject(value)) {
		return { operator: '_eq', value };
	}

	const childKey = Object.keys(value)[0];

	if (childKey) {
		return getOperation(childKey, Object.values(value)[0]);
	}

	return null;
}
