<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections';
import { Collection } from '@/types/collections';
import { isSystemCollection } from '@directus/system-data';
import { orderBy } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	disabled?: boolean;
	excludeCollections?: string[];
}>();

defineEmits<{
	select: [string];
}>();

const { t } = useI18n();
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
	<tr class="add-collection-row">
		<td colspan="7">
			<v-select
				:items="displayItems"
				item-text="collection"
				item-value="collection"
				:show-arrow="false"
				:placeholder="t('permission_add_collection')"
				placement="bottom-start"
				inline
				item-label-font-family="var(--theme--fonts--monospace--font-family)"
				@update:model-value="$emit('select', $event)"
			/>
		</td>
	</tr>
</template>

<style scoped lang="scss">
.add-collection-row {
	td {
		padding: 12px;
		border-top: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	}

	.monospace {
		font-family: var(--theme--fonts--monospace--font-family);
	}

	.v-select:hover {
		--v-select-placeholder-color: var(--theme--foreground-accent);
	}
}
</style>
