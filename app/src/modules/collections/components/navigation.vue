<template>
	<v-list
		v-model="activeGroups"
		scope="collections-navigation"
		class="collections-navigation"
		nav
		:mandatory="false"
		:dense="dense"
	>
		<navigation-item v-for="collection in rootItems" :key="collection.collection" :collection="collection" />
	</v-list>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { useNavigation } from '../composables/use-navigation';
import { useCollectionsStore } from '@/stores/collections';
import { orderBy, isNil } from 'lodash';
import NavigationItem from './navigation-item.vue';

export default defineComponent({
	components: { NavigationItem },
	setup() {
		const { t } = useI18n();
		const { activeGroups, showHidden } = useNavigation();
		const collectionsStore = useCollectionsStore();

		const rootItems = computed(() => {
			return orderBy(
				collectionsStore.visibleCollections.filter((collection) => {
					return isNil(collection?.meta?.group);
				}),
				['meta.sort', 'collection']
			);
		});

		const dense = computed(() => collectionsStore.visibleCollections.length > 5);

		return { t, activeGroups, showHidden, rootItems, dense };
	},
});
</script>

<style lang="scss" scoped>
.group-name {
	padding-left: 8px;
	font-weight: 600;
}

.empty {
	.v-button {
		--v-button-color: var(--foreground-subdued);
		--v-button-background-color: var(--foreground-subdued);
		--v-button-background-color-hover: var(--primary);
	}
}

.collections-navigation {
	--v-list-min-height: calc(100% - 64px);

	.v-detail {
		:deep(.v-divider) {
			margin: 0px;
		}

		&:not(:first-child) :deep(.v-divider) {
			margin-top: 8px;
		}

		&.empty :deep(.v-divider) {
			margin-bottom: 8px;
		}
	}
}

.hidden-collection {
	--v-list-item-color: var(--foreground-subdued);
}
</style>
