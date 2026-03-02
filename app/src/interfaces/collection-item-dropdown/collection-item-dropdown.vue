<script setup lang="ts">
import type { Filter, Item } from '@directus/types';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { computed, ref, toRefs, unref, watch } from 'vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VRemove from '@/components/v-remove.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import sdk, { requestEndpoint } from '@/sdk';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { unexpectedError } from '@/utils/unexpected-error';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import RenderTemplate from '@/views/private/components/render-template.vue';

type Value = {
	key: (string | number) | null;
	collection: string;
};

const props = withDefaults(
	defineProps<{
		value?: Value | null;
		selectedCollection: string;
		template?: string | null;
		disabled?: boolean;
		nonEditable?: boolean;
		filter?: Filter | null;
	}>(),
	{
		value: () => ({ key: null, collection: '' }),
		template: null,
		filter: null,
	},
);

const emit = defineEmits(['input']);

const { selectedCollection, template } = toRefs(props);

const collectionsStore = useCollectionsStore();
const fieldStore = useFieldsStore();

const loading = ref(false);
const selectDrawerOpen = ref(false);
const displayItem = ref<Record<string, any> | null>(null);

const value = computed({
	get: () => props.value,
	set: (value) => {
		if (value && typeof value === 'object' && value.key) {
			emit('input', value);
		} else {
			emit('input', null);
		}
	},
});

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

watch(value, getDisplayItem, { immediate: true });

async function getDisplayItem() {
	if (!value.value || !value.value.key) {
		displayItem.value = null;
		return;
	}

	if (!unref(selectedCollection) || !primaryKey.value) return;

	const fields = new Set(requiredFields.value);
	fields.add(primaryKey.value);

	try {
		loading.value = true;

		const response = await sdk.request<Item[]>(
			requestEndpoint(getEndpoint(unref(selectedCollection)), {
				params: { fields: Array.from(fields), filter: { [primaryKey.value]: { _eq: value.value?.key } } },
			}),
		);

		displayItem.value = response?.[0] ?? null;
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

function onSelection(selectedIds: (number | string)[] | null) {
	selectDrawerOpen.value = false;

	value.value = {
		key: Array.isArray(selectedIds) && selectedIds[0] ? selectedIds[0] : null,
		collection: unref(selectedCollection),
	};
}
</script>

<template>
	<div v-prevent-focusout="selectDrawerOpen" class="collection-item-dropdown">
		<VSkeletonLoader v-if="loading" type="input" />

		<VListItem v-else :disabled :non-editable block clickable @click="selectDrawerOpen = true">
			<div v-if="displayItem && displayTemplate" class="preview">
				<RenderTemplate :collection="selectedCollection" :item="displayItem" :template="displayTemplate" />
			</div>
			<div v-else class="placeholder">{{ $t('select_an_item') }}</div>

			<div class="spacer" />

			<div v-if="!nonEditable" class="item-actions">
				<VRemove v-if="displayItem" deselect :disabled @action="value = null" />

				<VIcon v-else class="expand" name="expand_more" />
			</div>
		</VListItem>

		<DrawerCollection
			v-model:active="selectDrawerOpen"
			:collection="selectedCollection"
			:selection="value?.key ? [value.key] : []"
			:filter="filter!"
			@input="onSelection"
			@update:active="selectDrawerOpen = false"
		/>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list-item {
	&.disabled:not(.non-editable) {
		--v-list-item-background-color: var(--theme--form--field--input--background-subdued);
	}

	&:focus-within,
	&:focus-visible {
		--v-list-item-border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus));
		--v-list-item-border-color-hover: var(--v-list-item-border-color);

		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}
}

.placeholder {
	color: var(--v-input-placeholder-color, var(--theme--foreground-subdued));
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
</style>
