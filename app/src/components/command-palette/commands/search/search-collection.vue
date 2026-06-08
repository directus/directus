<script setup lang="ts">
import { useApi } from '@directus/composables';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import CommandPaletteEmpty from '../../command-palette-empty.vue';
import CommandPaletteGroup from '../../command-palette-group.vue';
import CommandPaletteItem from '../../command-palette-item.vue';
import CommandPaletteList from '../../command-palette-list.vue';
import { useCommandPalette } from '../../composables/use-command-palette';
import { useRecentItems } from '../../composables/use-recent-items';
import { getRoutePrimaryKey } from '../../utils/get-route-primary-key';
import { useAiStore } from '@/ai/stores/use-ai';
import { useFieldsStore } from '@/stores/fields';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { getItemRoute } from '@/utils/get-route';
import { renderPlainStringTemplate } from '@/utils/render-string-template';
import { unexpectedError } from '@/utils/unexpected-error';

const props = defineProps<{
	collection: string;
	collectionName: string;
	collectionIcon: string;
	displayTemplate: string | null;
}>();

type SearchResult = {
	pk: string;
	displayValue: string;
	versionKey?: string;
	versionId?: string;
};

const { t } = useI18n();
const api = useApi();
const route = useRoute();
const router = useRouter();
const fieldsStore = useFieldsStore();
const { search, close, loading } = useCommandPalette();
const serverStore = useServerStore();
const settingsStore = useSettingsStore();

const aiAvailable = computed(() => serverStore.info.ai_enabled && settingsStore.availableAiProviders.length > 0);

function askAi() {
	const aiStore = useAiStore();
	aiStore.input = search.value;
	aiStore.chatOpen = true;
	aiStore.submit();
	close();
}

const currentPk = computed(() => {
	if (!route.path.startsWith(`/content/${props.collection}/`)) return null;
	if (route.params.primaryKey === '+') return '+';
	return getRoutePrimaryKey(route.params.primaryKey) ?? null;
});

const currentVersionKey = computed(() => getQueryValue(route.query.version));
const currentVersionId = computed(() => getQueryValue(route.query.versionId));
const currentRouteCollection = computed(() => getQueryValue(route.params.collection));

const searchVersionKey = computed(() => {
	if (currentRouteCollection.value !== props.collection) return undefined;
	return currentVersionKey.value;
});

const results = ref<SearchResult[]>([]);
const { items: rawRecentItems, add: addRecentItem } = useRecentItems(props.collection);
const recentItems = computed(() => rawRecentItems.value.filter((item) => isCurrentItem(item) === false));

const primaryKeyField = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(props.collection)?.field ?? 'id');

const template = computed(() => props.displayTemplate ?? `{{${primaryKeyField.value}}}`);

const fieldsToFetch = computed(() => {
	const templateFields = getFieldsFromTemplate(template.value);
	return [...new Set([primaryKeyField.value, ...templateFields])];
});

const showRecents = computed(() => !search.value && recentItems.value.length > 0);
const showHint = computed(() => !search.value && recentItems.value.length === 0);
const isEmpty = computed(() => !!search.value && !loading.value && results.value.length === 0);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let requestId = 0;

watch(search, (value) => {
	if (searchTimeout) clearTimeout(searchTimeout);
	const currentRequest = ++requestId;

	if (!value) {
		results.value = [];
		loading.value = false;
		return;
	}

	loading.value = true;

	searchTimeout = setTimeout(() => {
		fetchItems(value, currentRequest);
	}, 300);
});

onBeforeUnmount(() => {
	requestId++;
	if (searchTimeout) clearTimeout(searchTimeout);
	loading.value = false;
});

async function fetchItems(query: string, currentRequest: number) {
	try {
		const response = await api.get(getEndpoint(props.collection), {
			params: {
				search: query,
				fields: fieldsToFetch.value,
				limit: 25,
				...(searchVersionKey.value ? { version: searchVersionKey.value } : {}),
			},
		});

		if (currentRequest !== requestId) return;

		const fetchedItems = (response.data.data ?? []) as Record<string, any>[];
		const nextResults: SearchResult[] = [];

		for (const item of fetchedItems) {
			const pk = item[primaryKeyField.value];
			const versionId = getItemVersionId(item);
			const isItemlessDraft = searchVersionKey.value && pk === null && versionId;

			if (pk === null && !isItemlessDraft) continue;

			const result: SearchResult = {
				pk: isItemlessDraft ? '+' : String(pk),
				displayValue: renderPlainStringTemplate(template.value, item) ?? String(pk ?? versionId),
			};

			if (searchVersionKey.value) result.versionKey = searchVersionKey.value;
			if (isItemlessDraft) result.versionId = versionId;
			if (isCurrentItem(result) === false) nextResults.push(result);
		}

		results.value = nextResults;
	} catch (error) {
		if (currentRequest !== requestId) return;
		unexpectedError(error);
		results.value = [];
	} finally {
		if (currentRequest === requestId) loading.value = false;
	}
}

function selectItem(item: SearchResult) {
	addRecentItem({ collection: props.collection, ...item });
	router.push(getItemRoute(props.collection, item.pk, item.versionKey, item.versionId));
	close();
}

function getQueryValue(value: unknown) {
	if (Array.isArray(value)) return typeof value[0] === 'string' && value[0] ? value[0] : undefined;
	return typeof value === 'string' && value ? value : undefined;
}

function getItemVersionId(item: Record<string, any>) {
	const versionId = item.$meta?.version_id;
	if (versionId === null || versionId === undefined) return undefined;
	return String(versionId);
}

function isCurrentItem(item: { pk: string; versionKey?: string; versionId?: string }) {
	if (item.pk !== currentPk.value) return false;
	return item.versionKey === currentVersionKey.value && item.versionId === currentVersionId.value;
}

function getItemValue(item: { pk: string; versionKey?: string; versionId?: string }) {
	return [item.pk, item.versionKey, item.versionId].filter(Boolean).join(':');
}
</script>

<template>
	<CommandPaletteList :search-bar-placeholder="t('command_type_to_search', { collection: collectionName })">
		<CommandPaletteGroup v-if="showRecents" :heading="t('recent')">
			<CommandPaletteItem
				v-for="item in recentItems"
				:key="getItemValue(item)"
				:value="getItemValue(item)"
				:icon="collectionIcon"
				@select="selectItem(item)"
			>
				{{ item.displayValue }}
			</CommandPaletteItem>
		</CommandPaletteGroup>
		<CommandPaletteEmpty :show="showHint">
			{{ t('command_type_to_search', { collection: collectionName }) }}
		</CommandPaletteEmpty>
		<CommandPaletteEmpty :show="isEmpty && !aiAvailable">
			{{ t('no_results') }}
		</CommandPaletteEmpty>
		<CommandPaletteItem v-if="isEmpty && aiAvailable" value="ask-ai" icon="auto_awesome" @select="askAi">
			{{ t('command_ask_ai', { query: search }) }}
		</CommandPaletteItem>
		<CommandPaletteItem
			v-for="item in results"
			:key="getItemValue(item)"
			:value="getItemValue(item)"
			:icon="collectionIcon"
			@select="selectItem(item)"
		>
			{{ item.displayValue }}
		</CommandPaletteItem>
	</CommandPaletteList>
</template>
