import { snakeCase, kebabCase, camelCase } from 'lodash';

export const transformObject = (
	object: Record<string, any>,
	type: 'camelcase' | 'underscore' | 'kebab'
): Record<string, any> => {
	let transform = camelCase;

	switch (type) {
		case 'underscore':
			transform = snakeCase;
			break;

		case 'kebab':
			transform = kebabCase;
			break;
	}

	return Object.entries(object).reduce((acc, [key, value]) => {
		acc[transform(key)] = value;
		return acc;
	}, {} as Record<string, any>);
};
