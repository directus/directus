<script setup lang="ts">
import api from '@/api';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { hideDragImage } from '@/utils/hide-drag-image';
import { unexpectedError } from '@/utils/unexpected-error';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import { Filter, PrimaryKey } from '@directus/types';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';

type ValueItem = {
	key: PrimaryKey;
	collection: string;
};

const props = withDefaults(
	defineProps<{
		value?: ValueItem[] | null;
		selectedCollection: string;
		template?: string | null;
		disabled?: boolean;
		nonEditable?: boolean;
		filter?: Filter | null;
	}>(),
	{
		value: () => [],
		template: null,
		filter: null,
	},
);

const { t } = useI18n();

const emit = defineEmits(['input']);

const { selectedCollection, template } = toRefs(props);

const collectionsStore = useCollectionsStore();
const fieldStore = useFieldsStore();

const loading = ref(false);
const selectDrawerOpen = ref(false);
const displayItems = ref<Record<string, any>[]>([]);

const values = computed({
	get: () => props.value ?? [],
	set: (newValues) => {
		if (Array.isArray(newValues) && newValues.length > 0) {
			emit('input', newValues);
		} else {
			emit('input', null);
		}
	},
});

const selectedKeys = computed(() => values.value.map((item) => item.key));

const primaryKey = computed(() => fieldStore.getPrimaryKeyFieldForCollection(unref(selectedCollection))?.field ?? '');

const displayTemplate = computed(() => {
	if (unref(template)) return unref(template);

	const displayTemplate = collectionsStore.getCollection(unref(selectedCollection))?.meta?.display_template;

	return displayTemplate || `{{ ${primaryKey.value || ''} }}`;
});

const requiredFields = computed(() => {
	if (!displayTemplate.value || !unref(selectedCollection)) return [];
	return adjustFieldsForDisplays(getFieldsFromTemplate(displayTemplate.value), unref(selectedCollection));
});

watch(
	values,
	(newValues, oldValues) => {
		if (!oldValues || selectionHasChanged(newValues, oldValues)) {
			getDisplayItems();
		}
	},
	{ immediate: true },
);

function selectionHasChanged(newValues: ValueItem[], oldValues: ValueItem[]) {
	if (newValues.length !== oldValues.length) return true;

	const newKeys = new Set(newValues.map((v) => `${v.collection}_${v.key}`));
	const oldKeys = new Set(oldValues.map((v) => `${v.collection}_${v.key}`));

	return ![...newKeys].every((key) => oldKeys.has(key));
}

async function getDisplayItems() {
	if (!values.value || values.value.length === 0) {
		displayItems.value = [];
		return;
	}

	if (!unref(selectedCollection) || !primaryKey.value) return;

	const fields = new Set(requiredFields.value);
	fields.add(primaryKey.value);

	try {
		loading.value = true;

		const response = await api.get(getEndpoint(unref(selectedCollection)), {
			params: {
				fields: Array.from(fields),
				filter: { [primaryKey.value]: { _in: selectedKeys.value } },
			},
		});

		const fetchedItems = response.data.data ?? [];

		displayItems.value = selectedKeys.value
			.map((key) => fetchedItems.find((item: any) => item[primaryKey.value] === key))
			.filter(Boolean);
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

function onSelection(selectedIds: PrimaryKey[] | null) {
	selectDrawerOpen.value = false;

	if (!selectedIds || selectedIds.length === 0) {
		values.value = [];
		return;
	}

	const newValues = selectedIds.map((key) => ({
		key,
		collection: unref(selectedCollection),
	}));

	values.value = newValues;
}

function removeItem(item: Record<string, any>) {
	const keyToRemove = item[primaryKey.value];
	values.value = values.value.filter((v) => v.key !== keyToRemove);
}

function onSort(sortedItems: Record<string, any>[]) {
	displayItems.value = sortedItems;

	const newValues = sortedItems.map((item) => ({
		key: item[primaryKey.value],
		collection: unref(selectedCollection),
	}));

	values.value = newValues;
}
</script>

<template>
	<div v-prevent-focusout="selectDrawerOpen" class="collection-item-multiple-dropdown">
		<v-notice v-if="displayItems.length === 0">
			{{ t('no_items') }}
		</v-notice>

		<template v-else-if="loading">
			<v-skeleton-loader
				v-for="num in displayItems.length"
				:key="num"
				:type="displayItems.length > 4 ? 'block-list-item-dense' : 'block-list-item'"
			/>
		</template>

		<draggable
			v-else
			:model-value="displayItems"
			tag="v-list"
			:item-key="primaryKey"
			handle=".drag-handle"
			:disabled="disabled"
			:set-data="hideDragImage"
			v-bind="{ 'force-fallback': true }"
			@update:model-value="onSort($event)"
		>
			<template #item="{ element }">
				<v-list-item block :disabled :non-editable :dense="displayItems.length > 4">
					<v-icon v-if="!disabled" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />

					<render-template
						:collection="selectedCollection"
						:item="element"
						:template="displayTemplate"
						class="preview"
					/>

					<div class="spacer" />

					<div v-if="!nonEditable" class="item-actions">
						<v-remove v-if="!disabled" deselect @action="removeItem(element)" />
					</div>
				</v-list-item>
			</template>
		</draggable>

		<div v-if="!nonEditable" class="actions">
			<v-button :disabled="disabled" @click="selectDrawerOpen = true">
				{{ t('select_item') }}
			</v-button>
		</div>

		<drawer-collection
			v-model:active="selectDrawerOpen"
			:collection="selectedCollection"
			:selection="selectedKeys"
			:filter="filter!"
			multiple
			@input="onSelection"
			@update:active="selectDrawerOpen = false"
		/>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list {
	@include mixins.list-interface($deleteable: true);
}

.item-actions {
	@include mixins.list-interface-item-actions;
}

.preview {
	display: block;
	flex-grow: 1;
	block-size: calc(100% - 16px);
	overflow: hidden;
}

.actions {
	@include mixins.list-interface-actions;
}
</style>
