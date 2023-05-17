<template>
	<div class="list" :class="{ 'has-header': showHeader }">
		<div>
			<v-list>
				<v-list-item
					v-for="row in data"
					:key="row[primaryKeyField]"
					class="selectable"
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
	}
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
	} catch (err: any) {
		unexpectedError(err);
	}

	await insightsStore.refresh(props.dashboard);
}
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
