import ky from 'ky';
import { constructText } from './lib/construct-text.js';
import { constructUrl } from './lib/construct-url.js';
import { convertToSearchResult } from './lib/convert-to-search-result.js';
import { RegistrySearchResponse } from './schemas/registry-search-response.js';
import type { SearchOptions } from './types/search-options.js';
import { validateLimit } from './utils/validate-limit.js';
import { validateText } from './utils/validate-text.js';

export const search = async (options: SearchOptions = {}) => {
	if (options?.limit !== undefined) {
		validateLimit(options.limit);
	}

	if (options?.text) {
		validateText(options.text);
	}

	const text = constructText(options);
	const url = constructUrl(text, options);
	const rawRegistryResponse = await ky.get(url).json();
	const registrySearchResponse = await RegistrySearchResponse.parseAsync(rawRegistryResponse);

	return convertToSearchResult(registrySearchResponse);
};
