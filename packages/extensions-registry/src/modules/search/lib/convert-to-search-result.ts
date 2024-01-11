import type { RegistrySearchResponse } from '../schemas/registry-search-response.js';
import type { SearchResult } from '../types/search-result.js';
import { getPackageExtensionType } from '../../../utils/get-package-extension-type.js';

export const convertToSearchResult = (registryResponse: RegistrySearchResponse): SearchResult => {
	const filterCount = registryResponse.total;

	return {
		meta: {
			filter_count: filterCount,
		},
		data: registryResponse.objects.map((pkg) => ({
			name: pkg.package.name,
			description: pkg.package.description,
			version: pkg.package.version,
			type: getPackageExtensionType(pkg.package.keywords),
			author: pkg.package.author?.username ?? pkg.package.publisher.username,
			maintainers: pkg.package.maintainers.map(({ username }) => username),
		})),
	};
};
