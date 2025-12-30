import { constructUrl } from './lib/construct-url.js';
import { RegistryAccountResponse } from './schemas/registry-account-response.js';
import type { AccountOptions } from './types/account-options.js';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import ky from 'ky';

export type { RegistryAccountResponse } from './schemas/registry-account-response.js';
export type { AccountOptions } from './types/account-options.js';

/**
 * Retrieves account information from the extensions registry.
 *
 * This function fetches detailed account data for a specified user or organization
 * from the Directus extensions registry. It validates API version compatibility
 * and returns structured account information including profile details, published
 * extensions, and other relevant metadata.
 *
 * @param id - The unique identifier of the account to retrieve (username or organization name)
 * @param options - Optional configuration for the request
 * @param options.registry - Custom registry URL to use instead of the default registry
 * @returns Promise that resolves to validated account data from the registry
 *
 * @throws {Error} When API version compatibility check fails
 * @throws {Error} When the account ID is not found in the registry
 * @throws {Error} When network request fails or registry is unreachable
 * @throws {Error} When response data fails validation against the expected schema
 *
 * @example
 * ```typescript
 * // Get account information using default registry
 * const accountData = await account('directus');
 * console.log(accountData.name); // Account name
 * console.log(accountData.extensions); // Published extensions
 *
 * // Get account information from custom registry
 * const customAccountData = await account('my-org', {
 *   registry: 'https://custom-registry.example.com'
 * });
 *
 * // Handle errors
 * try {
 *   const accountData = await account('non-existent-user');
 * } catch (error) {
 *   console.error('Failed to fetch account:', error.message);
 * }
 * ```
 */
export const account = async (id: string, options?: AccountOptions) => {
	await assertVersionCompatibility(options);
	const url = constructUrl(id, options);
	const response = await ky.get(url).json();
	return await RegistryAccountResponse.parseAsync(response);
};
