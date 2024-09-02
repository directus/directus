import { DIRECTUS_VARIABLES_REGEX } from '../constants/directus-variables.js';

export const isDirectusVariable = (key: string): boolean => {
	if (key.endsWith('_FILE')) {
		key = key.slice(0, -5);
	}

	return DIRECTUS_VARIABLES_REGEX.some((regex) => regex.test(key));
};
