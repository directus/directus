<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		value: string | null;
		disabled?: boolean;
		includeSystem?: boolean;
		includeSingleton?: boolean;
	}>(),
	{ includeSingleton: true }
);

defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const { t } = useI18n();

const collectionsStore = useCollectionsStore();

const collections = computed(() => {
	let collections = collectionsStore.collections;

	if (!props.includeSingleton) {
		collections = collections.filter((collection) => collection?.meta?.singleton === false);
	}

	return [
		...collections.filter((collection) => collection.collection.startsWith('directus_') === false),
		...(props.includeSystem ? collectionsStore.crudSafeSystemCollections : []),
	];
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
		:items="items"
		:placeholder="t('select_a_collection')"
		@update:model-value="$emit('input', $event)"
	/>
</template>
