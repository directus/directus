import { CoreCollections } from "../../index.js";

/**
 *
 * @param value
 * @param message
 * @throws Throws an error if the collection starts with the `directus_` prefix
 */
export const throwIfCoreCollection = (value: string | number | symbol, message: string) => {
	if ((CoreCollections as readonly string[]).includes(String(value))) {
		throw new Error(message);
	}
};
