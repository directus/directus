<script setup lang="ts">
import { computed, ref } from 'vue';
import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import { useInsightsStore } from '@/stores/insights';
import { unexpectedError } from '@/utils/unexpected-error';
import { getEndpoint } from '@directus/utils';

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		displayTemplate?: string;
		linkToItem?: boolean;
		collection: string;
		dashboard: string;
		data?: object;
	}>(),
	{
		showHeader: false,
		displayTemplate: '',
		linkToItem: false,
		sortDirection: 'desc',
		data: () => ({}),
	},
);

const currentlyEditing = ref<number | string>();
const editsAtStart = ref<Record<string, any>>();

const fieldsStore = useFieldsStore();
const insightsStore = useInsightsStore();

const primaryKeyField = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(props.collection)?.field ?? 'id');

function startEditing(item: Record<string, any>) {
	if (!props.linkToItem) return;
	currentlyEditing.value = item[primaryKeyField.value];
}

function cancelEdit() {
	editsAtStart.value = undefined;
	currentlyEditing.value = undefined;
}

async function saveEdits(item: Record<string, any>) {
	try {
		await api.patch(`${getEndpoint(props.collection)}/${currentlyEditing.value}`, item);
	} catch (error) {
		unexpectedError(error);
	}

	await insightsStore.refresh(props.dashboard);
}
</script>

<template>
	<div class="list" :class="{ 'has-header': showHeader }">
		<div>
			<v-list>
				<v-list-item
					v-for="row in data"
					:key="row[primaryKeyField]"
					:clickable="linkToItem === true"
					@click="startEditing(row)"
				>
					<render-template :item="row" :collection="collection" :template="displayTemplate" />
					<div class="spacer" />
				</v-list-item>
			</v-list>
		</div>
		<drawer-item
			:active="!!currentlyEditing"
			:collection="collection"
			:primary-key="currentlyEditing ?? '+'"
			:edits="editsAtStart"
			@input="saveEdits"
			@update:active="cancelEdit"
		/>
	</div>
</template>

<style scoped>
.list {
	--v-list-padding: 0;
	--v-list-border-radius: 0;
	--v-list-item-border-radius: 0;
	--v-list-item-padding: 6px;
	--v-list-item-margin: 0;

	block-size: 100%;
	padding: 0 12px;
	overflow-y: auto;
}

.v-list-item {
	block-size: 48px;
	border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.v-list-item:last-child {
	border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}
</style>
