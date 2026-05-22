<script setup lang="ts">
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { useApi } from '@directus/composables';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useFieldsStore } from '@/stores/fields';
import { getItemRoute } from '@/utils/get-route';
import { renderPlainStringTemplate } from '@/utils/render-string-template';
import { unexpectedError } from '@/utils/unexpected-error';
import CommandPaletteEmpty from '../../command-palette-empty.vue';
import CommandPaletteGroup from '../../command-palette-group.vue';
import CommandPaletteItem from '../../command-palette-item.vue';
import CommandPaletteList from '../../command-palette-list.vue';
import { useCommandPalette } from '../../composables/use-command-palette';
import { useRecentItems } from '../../composables/use-recent-items';
import { useAiStore } from '@/ai/stores/use-ai';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';

const props = defineProps<{
	collection: string;
	collectionName: string;
	collectionIcon: string;
	displayTemplate: string | null;
}>();

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
	return String(route.params.primaryKey ?? '');
});

const results = ref<{ pk: string; displayValue: string }[]>([]);
const { items: rawRecentItems, add: addRecentItem } = useRecentItems(props.collection);
const recentItems = computed(() => rawRecentItems.value.filter((item) => item.pk !== currentPk.value));

const primaryKeyField = computed(
	() => fieldsStore.getPrimaryKeyFieldForCollection(props.collection)?.field ?? 'id',
);

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

	if (!value) {
		results.value = [];
		loading.value = false;
		return;
	}

	loading.value = true;

	searchTimeout = setTimeout(() => {
		fetchItems(value);
	}, 300);
});

onBeforeUnmount(() => {
	if (searchTimeout) clearTimeout(searchTimeout);
	loading.value = false;
});

async function fetchItems(query: string) {
	const currentRequest = ++requestId;

	try {
		const response = await api.get(getEndpoint(props.collection), {
			params: {
				search: query,
				fields: fieldsToFetch.value,
				limit: 25,
			},
		});

		if (currentRequest !== requestId) return;

		results.value = (response.data.data ?? [])
			.map((item: Record<string, any>) => ({
				pk: String(item[primaryKeyField.value]),
				displayValue: renderPlainStringTemplate(template.value, item) ?? String(item[primaryKeyField.value]),
			}))
			.filter((item: { pk: string }) => item.pk !== currentPk.value);
	} catch (error) {
		if (currentRequest !== requestId) return;
		unexpectedError(error);
		results.value = [];
	} finally {
		if (currentRequest === requestId) loading.value = false;
	}
}

function selectItem(pk: string, displayValue: string) {
	addRecentItem({ collection: props.collection, pk, displayValue });
	router.push(getItemRoute(props.collection, pk));
	close();
}
</script>

<template>
	<CommandPaletteList :search-bar-placeholder="t('command_type_to_search', { collection: collectionName })">
		<CommandPaletteGroup v-if="showRecents" :heading="t('recent')">
			<CommandPaletteItem
				v-for="item in recentItems"
				:key="item.pk"
				:value="item.pk"
				:icon="collectionIcon"
				@select="selectItem(item.pk, item.displayValue)"
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
			:key="item.pk"
			:value="item.pk"
			:icon="collectionIcon"
			@select="selectItem(item.pk, item.displayValue)"
		>
			{{ item.displayValue }}
		</CommandPaletteItem>
	</CommandPaletteList>
</template>
