import { URL } from 'url';
import { DEFAULT_REGISTRY } from '../../../constants.js';
import type { AccountOptions } from '../types/account-options.js';

/**
 * Constructs a URL for accessing account information in the extensions registry.
 *
 * @param id - The unique identifier of the account to access
 * @param options - Optional configuration object for URL construction
 * @param options.registry - The registry base URL to use (defaults to DEFAULT_REGISTRY if not provided)
 * @returns A URL object pointing to the specified account endpoint
 *
 * @example
 * ```typescript
 * // Using default registry
 * const url = constructUrl('user123');
 * console.log(url.toString()); // "https://registry.directus.io/accounts/user123"
 *
 * // Using custom registry
 * const customUrl = constructUrl('user456', {
 *   registry: 'https://custom-registry.example.com'
 * });
 * console.log(customUrl.toString()); // "https://custom-registry.example.com/accounts/user456"
 * ```
 */
export const constructUrl = (id: string, options?: AccountOptions): URL => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;
	const url = new URL(`/accounts/${id}`, registry);
	return url;
};
