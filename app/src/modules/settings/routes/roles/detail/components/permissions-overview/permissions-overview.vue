<template>
	<div class="permissions-overview">
		<h2 class="title type-label">
			{{ $t('permissions') }}
			<span class="instant-save">{{ $t('saves_automatically') }}</span>
		</h2>

		<div class="table">
			<permissions-overview-header />
			<permissions-overview-row
				v-for="collection in regularCollections"
				:key="collection.collection"
				:collection="collection"
				:role="role"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { useCollectionsStore } from '@/stores';
import PermissionsOverviewHeader from './permissions-overview-header.vue';
import PermissionsOverviewRow from './permissions-overview-row.vue';

export default defineComponent({
	components: { PermissionsOverviewHeader, PermissionsOverviewRow },
	props: {
		role: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();

		const regularCollections = computed(() =>
			collectionsStore.state.collections.filter(
				(collection) => collection.collection.startsWith('directus_') === false
			)
		);
		const systemCollections = computed(() =>
			collectionsStore.state.collections.filter(
				(collection) => collection.collection.startsWith('directus_') === false
			)
		);

		return { regularCollections, systemCollections };
	},
});
</script>

<style lang="scss" scoped>
.permissions-overview {
	position: relative;
}

.title {
	margin-bottom: 12px;

	.instant-save {
		margin-left: 4px;
		color: var(--warning);
	}
}

.table {
	max-width: 792px;
	background-color: var(--background-page);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}
</style>
