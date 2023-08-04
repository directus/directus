import type { RestCommand } from "../types.js";
import { withOptions } from "./with-options.js";

/**
 * Set credentials 'include' on a request
 *
 * @param getOptions
 *
 * @returns
 */
export function withCookies<Schema extends object, Output>(
	getOptions: RestCommand<Output, Schema>,
	credentials: RequestCredentials = 'include'
): RestCommand<Output, Schema> {
	return withOptions(getOptions, (options) => {
		options.credentials = credentials;
		return options;
	});
}
