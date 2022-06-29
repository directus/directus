<template>
	<div class="list" :class="{ 'has-header': showHeader }">
		<div>
			<v-list>
				<v-list-item v-for="row in data" :key="row[primaryKeyField.field]" class="selectable">
					<render-template :item="row" :collection="collection" :template="displayTemplate" />
					<div class="spacer" />
				</v-list-item>
			</v-list>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useFieldsStore } from '@/stores';
import { Filter } from '@directus/shared/types';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		displayTemplate?: string;
		sortField?: string;
		sortDirection?: string;
		collection: string;
		limit?: number;
		filter?: Filter;
		data?: object;
	}>(),
	{
		showHeader: false,
		displayTemplate: '',
		sortDirection: 'desc',
		limit: 5,
		filter: () => ({}),
		data: () => ({}),
	}
);

const fieldsStore = useFieldsStore();

const primaryKeyField = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(props.collection));
</script>

<style scoped>
.list {
	--v-list-padding: 0;
	--v-list-border-radius: 0;
	--v-list-item-border-radius: 0;
	--v-list-item-padding: 6px;
	--v-list-item-margin: 0;

	height: 100%;
	padding: 0 12px;
	overflow-y: auto;
}

.v-list-item {
	height: 48px;
	border-top: var(--border-width) solid var(--border-subdued);
}

.v-list-item:last-child {
	border-bottom: var(--border-width) solid var(--border-subdued);
}
</style>
