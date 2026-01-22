import type { Filter } from '@directus/types';
import { computed, type MaybeRef, unref } from 'vue';

/**
 * Creates a Directus filter for MIME type restrictions.
 * Supports wildcards like "image/*" and specific types like "image/jpeg".
 */
export function useMimeTypeFilter(allowedMimeTypes: MaybeRef<string[] | undefined>) {
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

	const acceptString = computed(() => {
		const types = unref(allowedMimeTypes);
		return types?.join(',');
	});

	return {
		mimeTypeFilter,
		acceptString,
	};
}
