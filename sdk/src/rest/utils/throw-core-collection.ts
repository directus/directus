import { isSystemCollection } from './is-system-collection.js';

/**
 *
 * @param value
 * @param message
 * @throws Throws an error if the collection starts with the `directus_` prefix
 */
export const throwIfCoreCollection = (value: string | number | symbol, message: string): void => {
	if (isSystemCollection(String(value))) {
		throw new Error(message);
	}
};
