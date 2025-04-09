import { isPlainObject } from 'lodash-es';

export function getFilterPath(key: string, value: Record<string, any>) {
	const path = [key];
	const childKey = Object.keys(value)[0];

	if (!childKey || (childKey.startsWith('_') === true && !['_none', '_some'].includes(childKey))) {
		return path;
	}

	if (isPlainObject(value)) {
		path.push(...getFilterPath(childKey, Object.values(value)[0]));
	}

	return path;
}
