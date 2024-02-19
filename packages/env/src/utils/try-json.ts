import { parseJSON } from '@directus/utils';

export const tryJson = (value: unknown) => {
	try {
		return parseJSON(String(value)) as unknown;
	} catch {
		return value;
	}
};
