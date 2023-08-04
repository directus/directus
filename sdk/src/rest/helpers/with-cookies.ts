import type { RestCommand } from "../types.js";
import { withOptions } from "./with-options.js";

/**
 * Set credentials on a request
 * Defaults to credentials: 'include'
 *
 * @param getOptions
 *
 * @returns
 */
export function withCookies<Schema extends object, Output>(
	getOptions: RestCommand<Output, Schema>,
	credentials: RequestCredentials = 'include',
): RestCommand<Output, Schema> {
	return withOptions(getOptions, { credentials });
}
