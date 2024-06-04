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

const systemCollections = orderBy(
	collectionsStore.collections.filter(({ collection }) => isSystemCollection(collection)).filter(notExcluded),
	['collection'],
);

const displayItems = computed(() => {
	const items: any[] = availableCollections.value;

	if (systemCollections.length > 0) {
		items.push(
			{ divider: true },
			// Don't do a separate group, since the v-select search does not open groups, so the experience is rather unpleasant
			...systemCollections,
		);
	}

	return items;
});

function notExcluded({ collection }: Collection) {
	return props.excludeCollections?.includes(collection) !== true;
}
</script>

<template>
	<tr class="add-collection-row">
		<td>
			<v-select
				:items="displayItems"
				item-text="collection"
				item-value="collection"
				:show-arrow="false"
				placement="bottom-start"
				inline
				item-label-font-family="var(--theme--fonts--monospace--font-family)"
				@update:model-value="$emit('select', $event)"
			>
				<template #preview>
					<v-button class="add-button" align="left">
						<v-icon name="add" small />
						<span>{{ t('permission_add_collection') }}</span>
					</v-button>
				</template>
			</v-select>
		</td>
		<td></td>
	</tr>
</template>

<style scoped lang="scss">
.add-collection-row {
	.monospace {
		font-family: var(--theme--fonts--monospace--font-family);
	}

	:deep(.placeholder) {
		display: flex;
		align-items: center;
		--v-button-color: var(--theme--foreground-subdued);

		.v-icon {
			position: relative !important;
			transition: var(--fast) var(--transition) !important;
		}

		&:hover {
			--v-button-color: var(--theme--foreground-accent);
			--v-button-color-hover: var(--theme--foreground-accent);

			.v-icon {
				color: var(--theme--foreground-accent);
			}
		}
	}

	.add-button {
		--v-button-background-color: var(--theme--form--field--input--background);
		--v-button-background-color-hover: var(--theme--form--field--input--background);
		--v-button-font-size: 14px;

		:deep(.button) {
			padding-left: 4px;
		}

		:deep(.content) {
			gap: 4px;
		}
	}

	td {
		border-top: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}
}
</style>
