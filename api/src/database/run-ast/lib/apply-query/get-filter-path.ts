import { isObject } from '@directus/utils';

export function getFilterPath(key: string, value: Record<string, any>) {
	const path = [key];
	const childKey = Object.keys(value)[0];

	if (!childKey || (childKey.startsWith('_') === true && !['_none', '_some'].includes(childKey))) {
		return path;
	}

	const nested_value = Object.values(value)[0];

	if (isObject(value)) {
		path.push(...getFilterPath(childKey, nested_value));
	}

	return path;
}
