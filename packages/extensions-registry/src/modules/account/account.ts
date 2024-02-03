import ky from 'ky';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import { constructUrl } from './lib/construct-url.js';
import { RegistryAuthorResponse } from './schemas/registry-author-response.js';
import type { AuthorOptions } from './types/author-options.js';

export type { AuthorOptions } from './types/author-options.js';

export const account = async (id: string, options?: AuthorOptions) => {
	await assertVersionCompatibility(options);
	const url = constructUrl(id, options);
	const response = await ky.get(url).json();
	return await RegistryAuthorResponse.parseAsync(response);
};
