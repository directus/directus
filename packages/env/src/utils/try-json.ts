import { parseJSON } from '@directus/utils';

export const tryJson = (value: unknown): unknown => {
	try {
		return parseJSON(String(value)) as unknown;
	} catch {
		return value;
	}
};
