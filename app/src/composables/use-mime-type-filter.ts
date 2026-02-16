import type { Filter } from '@directus/types';
import { computed, type MaybeRef, unref } from 'vue';

/**
 * Checks if a MIME type matches a pattern (supports wildcards like "image/*")
 */
function mimeTypeMatches(mimeType: string, pattern: string): boolean {
	if (pattern === '*/*') return true;

	if (pattern.endsWith('/*')) {
		const baseType = pattern.slice(0, -1); // "image/*" -> "image/"
		return mimeType.startsWith(baseType);
	}

	if (mimeType.endsWith('/*')) {
		const baseType = mimeType.slice(0, -1); // "image/*" -> "image/"
		return pattern.startsWith(baseType);
	}

	return mimeType === pattern;
}

/**
 * Computes the intersection of two MIME type allow lists.
 * The global list takes precedence - only types allowed by BOTH lists are returned.
 */
function intersectMimeTypes(interfaceTypes: string[], globalTypes: string[]): string[] {
	const result: string[] = [];

	for (const interfaceType of interfaceTypes) {
		// Check if this interface type is allowed by any global pattern
		const isAllowedByGlobal = globalTypes.some((globalType) => mimeTypeMatches(interfaceType, globalType));

		if (isAllowedByGlobal) {
			// If interface type is a wildcard, we need to narrow it down to what global allows
			if (interfaceType.endsWith('/*')) {
				// Find all global types that match this wildcard
				const matchingGlobalTypes = globalTypes.filter((globalType) => mimeTypeMatches(globalType, interfaceType));

				// If global has a matching wildcard of same or broader scope, keep interface wildcard
				const hasMatchingWildcard = matchingGlobalTypes.some(
					(gt) => gt.endsWith('/*') && mimeTypeMatches(interfaceType, gt),
				);

				if (hasMatchingWildcard) {
					result.push(interfaceType);
				} else {
					// Otherwise add the specific global types that match
					result.push(...matchingGlobalTypes.filter((gt) => !gt.endsWith('/*') || mimeTypeMatches(gt, interfaceType)));
				}
			} else {
				result.push(interfaceType);
			}
		}
	}

	return [...new Set(result)]; // Remove duplicates
}

/**
 * Creates a Directus filter for MIME type restrictions.
 * Supports wildcards like "image/*" and specific types like "image/jpeg".
 */
export function useMimeTypeFilter(
	allowedMimeTypes: MaybeRef<string[] | undefined>,
	globalMimeTypes?: MaybeRef<string[] | undefined>,
) {
	const mimeTypeFilter = computed<Filter | null>(() => {
		const types = unref(allowedMimeTypes);

		if (!types || types.length === 0) return null;

		const mimeFilters = types.map((mimeType) => {
			if (mimeType.endsWith('/*')) {
				// Wildcard like "image/*"
				return {
					type: {
						_starts_with: mimeType.slice(0, -1), // "image/"
					},
				};
			} else {
				// Specific type like "image/jpeg"
				return {
					type: {
						_eq: mimeType,
					},
				};
			}
		});

		if (mimeFilters.length === 1) {
			return mimeFilters[0] as Filter;
		}

		return {
			_or: mimeFilters,
		};
	});

	/**
	 * Combined accept string that respects global MIME restrictions.
	 * If global list is set, only types allowed by BOTH lists are included.
	 */
	const combinedAcceptString = computed(() => {
		const interfaceTypes = unref(allowedMimeTypes);
		const globalTypes = unref(globalMimeTypes);

		// If no global restriction, use interface types
		if (!globalTypes || globalTypes.length === 0) {
			return interfaceTypes?.join(',');
		}

		// If no interface restriction, use global types
		if (!interfaceTypes || interfaceTypes.length === 0) {
			return globalTypes.join(',');
		}

		// Compute intersection - only types allowed by BOTH
		const intersection = intersectMimeTypes(interfaceTypes, globalTypes);

		if (intersection.length === 0) {
			// No overlap - return global (it takes precedence)
			return globalTypes.join(',');
		}

		return intersection.join(',');
	});

	return {
		mimeTypeFilter,
		combinedAcceptString,
	};
}
