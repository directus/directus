import { provide } from 'vue';
import api from '@/api';
import { API_INJECT, EXTENSIONS_INJECT, STORES_INJECT } from '@directus/shared/constants';
import { useAppStore } from '@/stores/app';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useInsightsStore } from '@/stores/insights';
import { useLatencyStore } from '@/stores/latency';
import { useNotificationsStore } from '@/stores/notifications';
import { usePermissionsStore } from '@/stores/permissions';
import { usePresetsStore } from '@/stores/presets';
import { useRelationsStore } from '@/stores/relations';
import { useRequestsStore } from '@/stores/requests';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { useFlowsStore } from '@/stores/flows';
import { useExtensions } from '@/extensions';

export function useSystem(): void {
	provide(STORES_INJECT, {
		useAppStore,
		useCollectionsStore,
		useFieldsStore,
		useInsightsStore,
		useLatencyStore,
		useNotificationsStore,
		usePermissionsStore,
		usePresetsStore,
		useRelationsStore,
		useRequestsStore,
		useServerStore,
		useSettingsStore,
		useUserStore,
		useFlowsStore,
	});

	provide(API_INJECT, api);

	provide(EXTENSIONS_INJECT, useExtensions());
}
