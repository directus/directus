<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useContextStaging } from '../composables/use-context-staging';
import { usePrompts } from '../composables/use-prompts';
import { useSearchFilter } from '../composables/use-search-filter';
import type { MCPPrompt } from '../types';
import AiListItem from './ai-context-menu/list-item.vue';
import AiContextListView from './ai-context-menu/list-view.vue';
import AiMenuItem from './ai-context-menu/menu-item.vue';
import AiPromptVariablesModal from './ai-prompt-variables-modal.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VMenu from '@/components/v-menu.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useSettingsStore } from '@/stores/settings';
import { notify } from '@/utils/notify';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const collectionsStore = useCollectionsStore();
const { fetchPrompts, extractVariables } = usePrompts();
const { stagePrompt, stageItems } = useContextStaging();

const prompts = ref<MCPPrompt[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const showVariablesModal = ref(false);
const selectedPrompt = ref<MCPPrompt | null>(null);
const selectedPromptVariables = ref<string[]>([]);
const mainMenuOpen = ref(false);

const showItemDrawer = ref(false);
const selectedCollection = ref<string | null>(null);
const searchInputRef = ref<InstanceType<typeof import('@/components/v-input.vue').default> | null>(null);

const openListType = ref<'prompts' | 'items' | null>(null);

const isEnabled = computed(() => {
	return !!settingsStore.settings?.mcp_prompts_collection;
});

const collections = computed(() => {
	return collectionsStore.allCollections.filter((collection) => collection.type !== 'alias');
});

const filteredPrompts = useSearchFilter(prompts, searchQuery, ['name', 'description']);

const filteredCollections = useSearchFilter(collections, searchQuery, [(c) => c.name, (c) => c.collection]);

const showingSearchResults = computed(() => {
	return searchQuery.value && searchQuery.value.length > 0;
});

const menuOptions = computed(() => {
	const options = [
		{
			id: 'prompts',
			icon: 'magic_button',
			title: t('ai.prompts'),
			subtitle: t('ai.insert_reusable_prompt'),
			action: () => openList('prompts'),
			disabled: !isEnabled.value || prompts.value.length === 0,
		},
		{
			id: 'items',
			icon: 'box',
			title: t('ai.content'),
			subtitle: t('ai.insert_item_context'),
			action: () => openList('items'),
		},
	];

	if (!searchQuery.value) return options;

	const query = searchQuery.value.toLowerCase();
	return options.filter((opt) => opt.title.toLowerCase().includes(query) || opt.subtitle.toLowerCase().includes(query));
});

async function loadPrompts() {
	if (!isEnabled.value) return;

	loading.value = true;

	try {
		prompts.value = await fetchPrompts();
	} catch {
		notify({
			title: t('ai.failed_to_load_prompts'),
			type: 'error',
		});
	} finally {
		loading.value = false;
	}
}

function handleCollectionFromItemsList(collection: { collection: string; name: string }) {
	// Close menus
	mainMenuOpen.value = false;
	closeList();

	// Open drawer for this collection
	handleCollectionSelect(collection);
}

function handlePromptSelect(prompt: MCPPrompt) {
	const variables = extractVariables(prompt);

	// Close menus
	mainMenuOpen.value = false;
	closeList();

	if (variables.length > 0) {
		// Show modal for variable input
		selectedPrompt.value = prompt;
		selectedPromptVariables.value = variables;
		showVariablesModal.value = true;
	} else {
		// No variables, insert directly
		stagePrompt(prompt, {});
	}
}

function handleVariablesSubmit(values: Record<string, string>) {
	if (!selectedPrompt.value) return;

	stagePrompt(selectedPrompt.value, values);

	// Reset
	selectedPrompt.value = null;
	selectedPromptVariables.value = [];
	showVariablesModal.value = false;
}

function handleCollectionSelect(collection: { collection: string; name: string }) {
	selectedCollection.value = collection.collection;
	mainMenuOpen.value = false;
	showItemDrawer.value = true;
}

async function handleItemSelect(ids: (string | number)[] | null) {
	showItemDrawer.value = false;

	if (selectedCollection.value) {
		await stageItems(selectedCollection.value, ids);
	}

	selectedCollection.value = null;
}

onMounted(() => {
	loadPrompts();
});

function openMenu() {
	mainMenuOpen.value = true;
}

async function openList(type: 'prompts' | 'items') {
	openListType.value = type;
	searchQuery.value = '';
	await nextTick();

	// Focus search input
	const inputElement = searchInputRef.value?.$el?.querySelector('input');

	if (inputElement) {
		inputElement.focus();
	}
}

function closeList() {
	openListType.value = null;
	searchQuery.value = '';
}

defineExpose({
	handlePromptSelect,
	handleCollectionSelect,
	openMenu,
});
</script>

<template>
	<div class="ai-context-menu">
		<VMenu v-model="mainMenuOpen" placement="top-start" show-arrow :close-on-content-click="false">
			<template #activator="{ toggle }">
				<VButton v-tooltip="t('ai.add_content')" x-small icon secondary :loading="loading" @click="toggle">
					<VIcon name="add" small />
				</VButton>
			</template>

			<div class="menu-container">
				<!-- Search input (always visible) -->
				<VInput ref="searchInputRef" v-model="searchQuery" class="search-input" :placeholder="t('search')" autofocus>
					<template #prepend>
						<VIcon name="search" small />
					</template>
					<template v-if="searchQuery" #append>
						<VIcon name="close" small clickable @click="searchQuery = ''" />
					</template>
				</VInput>

				<!-- Main menu: Shows commands, and when searching also shows prompts + collections -->
				<div v-if="!openListType" class="menu-options-list">
					<AiMenuItem
						v-for="option in menuOptions"
						:key="option.id"
						:icon="option.icon"
						:title="option.title"
						:subtitle="option.subtitle"
						:disabled="option.disabled"
						@click="option.action"
					/>

					<template v-if="showingSearchResults">
						<AiListItem
							v-for="prompt in filteredPrompts"
							:key="prompt.id"
							icon="chat_bubble"
							:title="formatTitle(prompt.name)"
							:badge="t('ai.prompt')"
							:description="prompt.description"
							@click="handlePromptSelect(prompt)"
						/>

						<AiListItem
							v-for="collection in filteredCollections"
							:key="collection.collection"
							:icon="collection.icon || 'dataset'"
							:title="collection.name || formatTitle(collection.collection)"
							:badge="t('collection')"
							:description="collection.collection"
							@click="handleCollectionSelect(collection)"
						/>

						<div
							v-if="menuOptions.length === 0 && filteredPrompts.length === 0 && filteredCollections.length === 0"
							class="no-results"
						>
							{{ t('no_results') }}
						</div>
					</template>
				</div>

				<!-- Prompts list -->
				<AiContextListView
					v-if="openListType === 'prompts'"
					:title="t('ai.prompts')"
					:items="filteredPrompts"
					show-header
					:empty-message="t('no_results')"
					@back="closeList"
				>
					<template #item="{ item: prompt }">
						<AiListItem
							:title="formatTitle(prompt.name)"
							:description="prompt.description"
							@click="handlePromptSelect(prompt)"
						/>
					</template>
				</AiContextListView>

				<!-- Items list (Collections) -->
				<AiContextListView
					v-if="openListType === 'items'"
					:title="t('ai.content')"
					:items="filteredCollections"
					item-key="collection"
					show-header
					:empty-message="t('no_results')"
					@back="closeList"
				>
					<template #item="{ item: collection }">
						<AiListItem
							:icon="collection.icon || 'dataset'"
							:title="collection.name || formatTitle(collection.collection)"
							:description="collection.collection"
							@click="handleCollectionFromItemsList(collection)"
						/>
					</template>
				</AiContextListView>
			</div>
		</VMenu>

		<AiPromptVariablesModal
			v-model="showVariablesModal"
			:prompt="selectedPrompt"
			:variables="selectedPromptVariables"
			@submit="handleVariablesSubmit"
		/>

		<DrawerCollection
			v-if="selectedCollection"
			v-model:active="showItemDrawer"
			:collection="selectedCollection"
			multiple
			@input="handleItemSelect"
		/>
	</div>
</template>

<style scoped>
.ai-context-menu {
	display: inline-flex;
}

.menu-container {
	display: flex;
	flex-direction: column;
	min-inline-size: 320px;
	max-inline-size: 400px;
	max-block-size: 400px;
	overflow: hidden;
}

.search-input {
	padding: 8px;
}

.menu-options-list {
	overflow-y: auto;
}

.no-results {
	text-align: center;
	color: var(--theme--foreground-subdued);
	padding: 12px;
}
</style>
