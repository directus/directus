import { inject } from 'vue';
import { AxiosInstance } from 'axios';
import { API_INJECT, STORES_INJECT } from '../constants';

export function useStores(): Record<string, any> {
	const stores = inject<Record<string, any>>(STORES_INJECT);

	if (!stores) throw new Error('[useStores]: This function has to be used inside a Directus extension.');

	return stores;
}

export function useApi(): AxiosInstance {
	const api = inject<AxiosInstance>(API_INJECT);

	if (!api) throw new Error('[useApi]: This function has to be used inside a Directus extension.');

	return api;
}
