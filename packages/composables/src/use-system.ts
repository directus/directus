import { API_INJECT, EXTENSIONS_INJECT, SDK_INJECT, STORES_INJECT } from '@directus/constants';
import type { AppExtensionConfigs } from '@directus/extensions';
import type { DirectusClient, RestClient } from '@directus/sdk';
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

export function useSdk<Schema extends object = any>(): DirectusClient<Schema> & RestClient<Schema> {
	const sdk = inject<DirectusClient<Schema> & RestClient<Schema>>(SDK_INJECT);

	if (!sdk) throw new Error('[useSdk]: The sdk could not be found.');

	return sdk;
}

export function useExtensions(): RefRecord<AppExtensionConfigs> {
	const extensions = inject<RefRecord<AppExtensionConfigs>>(EXTENSIONS_INJECT);

	if (!extensions) throw new Error('[useExtensions]: The extensions could not be found.');

	return extensions;
}
