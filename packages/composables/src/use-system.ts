import { API_INJECT, EXTENSIONS_INJECT, STORES_INJECT } from '@directus/constants';
import type { AppExtensionConfigs } from '@directus/extensions';
import type { RefRecord } from '@directus/types';
import type { AxiosInstance } from 'axios';
import { inject } from 'vue';

export function useStores(): Record<string, any> {
	const stores = inject<Record<string, any>>(STORES_INJECT);

	if (!stores) throw new Error('[useStores]: The stores could not be found.');

	return stores;
}

export function useApi(): AxiosInstance {
	const api = inject<AxiosInstance>(API_INJECT);

	if (!api) throw new Error('[useApi]: The api could not be found.');

	return api;
}

export function useExtensions(): RefRecord<AppExtensionConfigs> {
	const extensions = inject<RefRecord<AppExtensionConfigs>>(EXTENSIONS_INJECT);

	if (!extensions) throw new Error('[useExtensions]: The extensions could not be found.');

	return extensions;
}
