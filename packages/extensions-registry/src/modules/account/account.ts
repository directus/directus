import ky from 'ky';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import { constructUrl } from './lib/construct-url.js';
import { RegistryAccountResponse } from './schemas/registry-account-response.js';
import type { AccountOptions } from './types/account-options.js';

export type { RegistryAccountResponse } from './schemas/registry-account-response.js';
export type { AccountOptions } from './types/account-options.js';

export const account = async (id: string, options?: AccountOptions) => {
	await assertVersionCompatibility(options);
	const url = constructUrl(id, options);
	const response = await ky.get(url).json();
	return await RegistryAccountResponse.parseAsync(response);
};
