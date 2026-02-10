import { API_INJECT, EXTENSIONS_INJECT, SDK_INJECT, STORES_INJECT } from '@directus/constants';
import { useAppStore } from '@directus/stores';
import api from '@/api';
import { useExtensions } from '@/extensions';
import sdk from '@/sdk';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useFlowsStore } from '@/stores/flows';
import { useInsightsStore } from '@/stores/insights';
import { useNotificationsStore } from '@/stores/notifications';
import { usePermissionsStore } from '@/stores/permissions';
import { usePresetsStore } from '@/stores/presets';
import { useRelationsStore } from '@/stores/relations';
import { useRequestsStore } from '@/stores/requests';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useTranslationsStore } from '@/stores/translations';
import { useUserStore } from '@/stores/user';
import { App } from 'vue';

export function useSystem(app: App): void {
	app.provide(STORES_INJECT, {
		useAppStore,
		useCollectionsStore,
		useFieldsStore,
		useFlowsStore,
		useInsightsStore,
		useNotificationsStore,
		usePermissionsStore,
		usePresetsStore,
		useRelationsStore,
		useRequestsStore,
		useServerStore,
		useSettingsStore,
		useTranslationsStore,
		useUserStore,
	});

	app.provide(API_INJECT, api);

	app.provide(SDK_INJECT, sdk);

	app.provide(EXTENSIONS_INJECT, useExtensions());
}
