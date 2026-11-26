<script setup lang="ts">
import type { Filter } from '@directus/types';
import { getEndpoint, getFieldsFromTemplate, isDynamicVariable } from '@directus/utils';
import { debounce } from 'lodash-es';
import { computed, nextTick, ref, watch } from 'vue';
import api from '@/api';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import RenderTemplate from '@/views/private/components/render-template.vue';

type Value = string | number | null;

const PAGE_SIZE = 10;

const props = withDefaults(
	defineProps<{
		value: Value;
		relatedCollection: string;
		template?: string | null;
		commaAllowed?: boolean;
	}>(),
	{
		template: null,
	},
);

const emit = defineEmits<{
	input: [value: Value];
	commaValuePasted: [value: string];
}>();

const fieldsStore = useFieldsStore();
const collectionsStore = useCollectionsStore();

const menuActive = ref(false);
const search = ref('');
let latestRequest = 0;
const items = ref<Record<string, any>[]>([]);
const loading = ref(false);
const selectedItem = ref<Record<string, any> | null>(null);

const primaryKeyField = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(props.relatedCollection));

const displayTemplate = computed(() => {
	if (props.template) return props.template;

	const collectionTemplate = collectionsStore.getCollection(props.relatedCollection)?.meta?.display_template;

	return collectionTemplate || `{{ ${primaryKeyField.value?.field ?? ''} }}`;
});

const requiredFields = computed(() => {
	const fields = new Set(
		adjustFieldsForDisplays(getFieldsFromTemplate(displayTemplate.value), props.relatedCollection),
	);

	if (primaryKeyField.value) fields.add(primaryKeyField.value.field);
	return [...fields];
});

const searchableFields = computed(() =>
	requiredFields.value.filter((path) => {
		const field = fieldsStore.getField(props.relatedCollection, path);
		return (
			field &&
			['string', 'text'].includes(field.type) &&
			!field.schema?.foreign_key_table &&
			!field.schema?.is_primary_key
		);
	}),
);

const isLookupValue = computed(
	() =>
		(typeof props.value === 'string' || typeof props.value === 'number') &&
		props.value !== '' &&
		!isDynamicVariable(String(props.value)) &&
		!/^{{.*}}$/.test(String(props.value)),
);

const rawSearch = computed(() => search.value.trim());

watch(() => props.value, fetchSelectedItem, { immediate: true });

watch(menuActive, (active) => {
	if (!active) return;
	search.value = '';
	fetchItems();
});

const debouncedFetchItems = debounce(fetchItems, 250);

watch(search, () => {
	if (menuActive.value) debouncedFetchItems();
});

defineExpose({
	focus() {
		menuActive.value = true;
	},
});

async function fetchSelectedItem() {
	if (!isLookupValue.value || !primaryKeyField.value) {
		selectedItem.value = null;
		return;
	}

	if (selectedItem.value && selectedItem.value[primaryKeyField.value.field] === props.value) return;

	const fromList = items.value.find((item) => item[primaryKeyField.value!.field] === props.value);

	if (fromList) {
		selectedItem.value = fromList;
		return;
	}

	try {
		const response = await api.get(getEndpoint(props.relatedCollection), {
			params: {
				fields: requiredFields.value,
				filter: { [primaryKeyField.value.field]: { _eq: props.value } },
				limit: 1,
			},
		});

		selectedItem.value = response.data.data?.[0] ?? null;
	} catch {
		selectedItem.value = null;
	}
}

async function fetchItems() {
	if (!primaryKeyField.value) return;

	const request = ++latestRequest;
	loading.value = true;

	try {
		const params: Record<string, unknown> = {
			fields: requiredFields.value,
			limit: PAGE_SIZE,
		};

		if (rawSearch.value) {
			const filter = searchFilter(rawSearch.value);
			if (filter) params.filter = filter;
			else params.search = rawSearch.value;
		}

		const response = await api.get(getEndpoint(props.relatedCollection), { params });

		if (request === latestRequest) items.value = response.data.data ?? [];
	} catch {
		if (request === latestRequest) items.value = [];
	} finally {
		if (request === latestRequest) loading.value = false;
	}
}

function searchFilter(query: string): Filter | null {
	if (searchableFields.value.length === 0) return null;

	const rules = searchableFields.value.map(
		(path) =>
			path
				.split('.')
				.reduceRight<Record<string, unknown>>((rule, key) => ({ [key]: rule }), { _icontains: query }) as Filter,
	);

	if (primaryKeyField.value && isValidPrimaryKey(query)) {
		rules.push({ [primaryKeyField.value.field]: { _eq: query } });
	}

	return { _or: rules };
}

function isValidPrimaryKey(query: string) {
	switch (primaryKeyField.value?.type) {
		case 'integer':
		case 'bigInteger':
			return /^\d+$/.test(query);
		case 'uuid':
			return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(query);
		default:
			return true;
	}
}

function selectItem(item: Record<string, any>) {
	selectedItem.value = item;
	emit('input', item[primaryKeyField.value!.field]);
	menuActive.value = false;
}

function useRawValue() {
	if (!rawSearch.value) return;
	emit('input', rawSearch.value);
	menuActive.value = false;
}

function clear() {
	emit('input', null);
	menuActive.value = false;
}

async function onEnter() {
	if (!rawSearch.value) return;

	debouncedFetchItems.cancel();
	await fetchItems();
	await nextTick();

	const pkField = primaryKeyField.value!.field;
	const exactMatch = items.value.find((item) => String(item[pkField]) === rawSearch.value);
	const match = exactMatch ?? items.value[0];

	if (match) selectItem(match);
	else useRawValue();
}

function onPaste(event: ClipboardEvent) {
	if (!props.commaAllowed) return;

	const clipboardData = event.clipboardData?.getData('text') || '';

	if (clipboardData.includes(',')) {
		event.preventDefault();
		menuActive.value = false;
		emit('commaValuePasted', clipboardData);
	}
}
</script>

<template>
	<VMenu v-model="menuActive" :close-on-content-click="false" show-arrow placement="bottom-start">
		<template #activator="{ toggle }">
			<div class="preview" :class="{ empty: value === null || value === '' }" @click="toggle">
				<RenderTemplate
					v-if="selectedItem"
					:collection="relatedCollection"
					:item="selectedItem"
					:template="displayTemplate"
				/>
				<template v-else-if="value !== null && value !== ''">{{ value }}</template>
			</div>
		</template>

		<div class="m2o-filter-menu">
			<VInput
				:model-value="search"
				small
				autofocus
				:placeholder="$t('interfaces.filter.search_or_paste_id')"
				@update:model-value="search = $event ?? ''"
				@keydown:enter="onEnter"
				@paste="onPaste"
			>
				<template #append>
					<VProgressCircular v-if="loading" indeterminate small />
					<VIcon v-else name="search" small />
				</template>
			</VInput>

			<VList class="results">
				<VListItem
					v-for="item in items"
					:key="item[primaryKeyField!.field]"
					clickable
					:active="selectedItem?.[primaryKeyField!.field] === item[primaryKeyField!.field]"
					@click="selectItem(item)"
				>
					<VListItemContent>
						<RenderTemplate :collection="relatedCollection" :item="item" :template="displayTemplate" />
					</VListItemContent>
				</VListItem>

				<VListItem v-if="!loading && items.length === 0" class="no-items">
					<VListItemContent>{{ $t('no_items') }}</VListItemContent>
				</VListItem>

				<VListItem v-if="rawSearch" clickable class="raw-value" @click="useRawValue">
					<VListItemIcon><VIcon name="keyboard_return" small /></VListItemIcon>
					<VListItemContent>{{ $t('interfaces.filter.use_value', { value: rawSearch }) }}</VListItemContent>
				</VListItem>

				<VListItem v-if="value !== null && value !== ''" clickable class="clear" @click="clear">
					<VListItemIcon><VIcon name="close" small /></VListItemIcon>
					<VListItemContent>{{ $t('clear_value') }}</VListItemContent>
				</VListItem>
			</VList>
		</div>
	</VMenu>
</template>

<style lang="scss" scoped>
.preview {
	display: flex;
	align-items: center;
	max-inline-size: 40ch;
	overflow: hidden;
	color: var(--theme--primary);
	white-space: nowrap;
	text-overflow: ellipsis;
	cursor: pointer;

	&.empty::after {
		color: var(--theme--form--field--input--foreground-subdued);
		font-family: var(--theme--fonts--monospace--font-family);
		content: '--';
	}

	:deep(.render-template) {
		color: var(--theme--primary);
	}
}

.m2o-filter-menu {
	inline-size: 22rem;
	padding: 0.5rem;
}

.results {
	--v-list-padding: 0.25rem 0 0;

	max-block-size: 20rem;
	overflow-y: auto;
}

.no-items {
	color: var(--theme--foreground-subdued);
}

.raw-value,
.clear {
	color: var(--theme--foreground-subdued);
	font-family: var(--theme--fonts--monospace--font-family);
}
</style>
