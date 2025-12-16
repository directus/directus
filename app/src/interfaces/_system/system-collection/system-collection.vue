<script setup lang="ts">
import VSelect from '@/components/v-select/v-select.vue';
import { useCollectionsStore } from '@/stores/collections';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		value: string | null;
		disabled?: boolean;
		includeSystem?: boolean;
		includeSingleton?: boolean;
		allowNone?: boolean;
	}>(),
	{ includeSingleton: true },
);

defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const collectionsStore = useCollectionsStore();

const collections = computed(() => {
	let collections = collectionsStore.allCollections;

	if (!props.includeSingleton) {
		collections = collections.filter((collection) => collection?.meta?.singleton === false);
	}

	return [...collections, ...(props.includeSystem ? collectionsStore.crudSafeSystemCollections : [])];
});

const items = computed(() => {
	return collections.value.reduce<{ text: string; value: string }[]>((acc, collection) => {
		if (collection.type !== 'alias') {
			acc.push({
				text: collection.name,
				value: collection.collection,
			});
		}

		return acc;
	}, []);
});
</script>

<template>
	<v-select
		:model-value="value"
		:disabled="disabled"
		:show-deselect="allowNone"
		:items="items"
		:placeholder="$t('select_a_collection')"
		@update:model-value="$emit('input', $event)"
	/>
</template>
