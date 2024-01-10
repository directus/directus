import ky from 'ky';
import { constructText } from './lib/construct-text.js';
import { constructUrl } from './lib/construct-url.js';
import { convertToSearchResult } from './lib/convert-to-search-result.js';
import type { SearchOptions } from './types/search-options.js';
import { validateSearchLimit } from './utils/validate-limit.js';
import { validateSearchText } from './utils/validate-text.js';
import { RegistrySearchResponse } from './schemas/registry-search-response.js';

export const search = async (options: SearchOptions = {}) => {
	if (options?.limit !== undefined) {
		validateSearchLimit(options.limit);
	}

	if (options?.text) {
		validateSearchText(options.text);
	}

	const text = constructText(options);
	const url = constructUrl(text, options);

	const rawRegistryResponse = await ky.get(url).json();

	const registrySearchResponse = RegistrySearchResponse.parse(rawRegistryResponse);

	return convertToSearchResult(registrySearchResponse);
};
