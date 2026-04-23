import { createDirectus, rest, staticToken, readItem } from '@directus/sdk';

export default defineNuxtPlugin(() => {
	const token = useRuntimeConfig().public.dontDoThisInProductionToken || useRuntimeConfig().directusServerToken;

	const directus = createDirectus(`${useRuntimeConfig().public.directusUrl}`, {
		globals: {
			fetch: $fetch,
		},
	})
		.with(rest())
		.with(staticToken(token));

	return {
		provide: {
			directus,
			readItemWithVersionFallbackToMain,
		},
	};

	async function readItemWithVersionFallbackToMain(
		collection: string,
		item: string | number,
		query: Record<string, unknown>,
		version: string | undefined,
	) {
		if (!version || version === 'main') {
			return await directus.request(readItem(collection, item, query));
		}

		try {
			return await directus.request(
				readItem(collection, item, {
					...query,
					version: version,
				}),
			);
		} catch {
			return await directus.request(readItem(collection, item, query));
		}
	}
});
