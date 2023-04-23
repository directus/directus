<template>
	<v-select
		:model-value="value"
		:disabled="disabled"
		:items="items"
		:placeholder="t('select_a_collection')"
		@update:model-value="$emit('input', $event)"
	/>
</template>

<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	value: string | null;
	disabled?: boolean;
	includeSystem?: boolean;
	includeSingleton?: boolean;
}>();

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
	return collections.value.map((collection) => ({
		text: collection.name,
		value: collection.collection,
	}));
});
</script>
