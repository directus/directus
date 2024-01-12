import { getPackageExtensionType } from '../../../utils/get-package-extension-type.js';
import type { RegistrySearchResponse } from '../schemas/registry-search-response.js';
import type { SearchResult } from '../types/search-result.js';

export const convertToSearchResult = (registryResponse: RegistrySearchResponse): SearchResult => {
	const filterCount = registryResponse.total;

	return {
		meta: {
			filter_count: filterCount,
		},
		data: registryResponse.objects.map((pkg) => ({
			name: pkg.package.name,
			description: pkg.package.description ?? null,
			version: pkg.package.version,
			type: getPackageExtensionType(pkg.package.keywords),
			publisher: pkg.package.publisher.username,
			maintainers: pkg.package.maintainers.map(({ username }) => username),
		})),
	};
};
