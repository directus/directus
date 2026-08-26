<script setup lang="ts">
import { isSystemCollection } from '@directus/system-data';
import { computed } from 'vue';
import VNotice from '@/components/v-notice.vue';
import InterfaceSelectMultipleDropdown from '@/interfaces/select-multiple-dropdown/select-multiple-dropdown.vue';
import { useCollectionsStore } from '@/stores/collections';

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
	<VNotice v-if="items.length === 0">
		{{ $t('no_collections') }}
	</VNotice>
	<InterfaceSelectMultipleDropdown
		v-else
		:choices="items"
		:value="value ?? undefined"
		:disabled="disabled"
		:placeholder="$t('collections')"
		@input="$emit('input', $event)"
	/>
</template>
