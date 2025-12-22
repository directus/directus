import ky from 'ky';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import { handleRegistryError } from '../../utils/handle-registry-error.js';
import { constructUrl } from './lib/construct-url.js';
import { RegistryListResponse } from './schemas/registry-list-response.js';
import type { ListOptions } from './types/list-options.js';
import type { ListQuery } from './types/list-query.js';

export type { RegistryListResponse } from './schemas/registry-list-response.js';
export type { ListOptions } from './types/list-options.js';
export type { ListQuery } from './types/list-query.js';

export const list = async (query: ListQuery, options?: ListOptions) => {
	try {
		await assertVersionCompatibility(options);
		const url = constructUrl(query, options);
		const response = await ky.get(url).json();
		return await RegistryListResponse.parseAsync(response);
	} catch (error) {
		handleRegistryError(error);
	}
};
