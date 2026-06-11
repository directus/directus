import type { GlobalSearchCollectionConfig, GlobalSearchConfig } from '@directus/types';

export const DEFAULT_GLOBAL_SEARCH_TRIGGER_RATE = 150;
export const MIN_GLOBAL_SEARCH_TRIGGER_RATE = 50;
export const MAX_GLOBAL_SEARCH_TRIGGER_RATE = 2000;

export function getGlobalSearchCollections(
	config: GlobalSearchConfig | null | undefined,
): GlobalSearchCollectionConfig[] {
	return Array.isArray(config?.collections) ? config.collections : [];
}

export function getGlobalSearchTriggerRate(config: GlobalSearchConfig | null | undefined) {
	const triggerRate = Number(config?.triggerRate ?? DEFAULT_GLOBAL_SEARCH_TRIGGER_RATE);

	if (
		Number.isInteger(triggerRate) &&
		triggerRate >= MIN_GLOBAL_SEARCH_TRIGGER_RATE &&
		triggerRate <= MAX_GLOBAL_SEARCH_TRIGGER_RATE
	) {
		return triggerRate;
	}

	return DEFAULT_GLOBAL_SEARCH_TRIGGER_RATE;
}
