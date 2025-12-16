<script setup lang="ts">
import VNotice from '@/components/v-notice.vue';
import InterfaceSelectMultipleCheckbox from '@/interfaces/select-multiple-checkbox/select-multiple-checkbox.vue';
import { useCollectionsStore } from '@/stores/collections';
import { isSystemCollection } from '@directus/system-data';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		value: string[] | null;
		disabled?: boolean;
		includeSystem?: boolean;
		includeSingleton?: boolean;
	}>(),
	{ includeSingleton: true },
);

defineEmits<{
	(e: 'input', value: string[] | null): void;
}>();

const collectionsStore = useCollectionsStore();

const collections = computed(() => {
	let collections = collectionsStore.sortedCollections.filter((collection) => collection.type === 'table');

	if (!props.includeSingleton) {
		collections = collections.filter((collection) => collection?.meta?.singleton === false);
	}

	if (!props.includeSystem) {
		collections = collections.filter((collection) => isSystemCollection(collection.collection) === false);
	}

	return collections;
});

const items = computed(() => {
	return collections.value.map((collection) => ({
		text: collection.name,
		value: collection.collection,
	}));
});
</script>

<template>
	<v-notice v-if="items.length === 0">
		{{ $t('no_collections') }}
	</v-notice>
	<interface-select-multiple-checkbox
		v-else
		:choices="items"
		:value="value"
		:disabled="disabled"
		@input="$emit('input', $event)"
	/>
</template>
