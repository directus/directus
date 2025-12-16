<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useCollectionsStore } from '@/stores/collections';
import { Collection } from '@/types/collections';
import { isSystemCollection } from '@directus/system-data';
import { orderBy } from 'lodash';
import { computed } from 'vue';

const props = defineProps<{
	excludeCollections?: string[];
}>();

defineEmits<{
	select: [string];
}>();

const collectionsStore = useCollectionsStore();

const availableCollections = computed(() => {
	return orderBy(collectionsStore.databaseCollections.filter((collection) => collection.meta).filter(notExcluded), [
		'collection',
	]);
});

const systemCollections = computed(() =>
	orderBy(collectionsStore.collections.filter(({ collection }) => isSystemCollection(collection)).filter(notExcluded), [
		'collection',
	]),
);

const displayItems = computed(() => {
	const items: any[] = [...availableCollections.value];

	// Don't use a separate group for system collections, since the v-select search does not open groups,
	// so the experience is rather unpleasant

	if (availableCollections.value.length > 0 && systemCollections.value.length > 0) {
		items.push({ divider: true });
	}

	items.push(...systemCollections.value);

	return items;
});

function notExcluded({ collection }: Collection) {
	return props.excludeCollections?.includes(collection) === false;
}
</script>

<template>
	<div>
		<v-select
			:items="displayItems"
			item-text="collection"
			item-value="collection"
			placement="bottom-start"
			item-label-font-family="var(--theme--fonts--monospace--font-family)"
			@update:model-value="$emit('select', $event)"
		>
			<template #preview="{ toggle }">
				<v-button @click="toggle">
					{{ $t('permission_add_collection') }}
					<v-icon name="arrow_drop_down" right />
				</v-button>
			</template>
		</v-select>
	</div>
</template>
