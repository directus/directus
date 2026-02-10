<script setup lang="ts">
import type { ContentVersion, Filter } from '@directus/types';
import { getFieldsFromTemplate } from '@directus/utils';
import { get, isNil } from 'lodash';
import { computed, ref, toRefs } from 'vue';
import VNotice from '@/components/v-notice.vue';
import { Sort } from '@/components/v-table/types';
import { useListHandlers } from '@/composables/use-list-handlers';
import { useListRelation } from '@/composables/use-list-relation';
import type { DisplayItem } from '@/composables/use-relation-multiple';
import { useRelationO2M } from '@/composables/use-relation-o2m';
import { useRelationPermissionsO2M } from '@/composables/use-relation-permissions';
import ListRelationLayout from '@/interfaces/shared/list-relation-layout.vue';
import { useFieldsStore } from '@/stores/fields';
import { LAYOUTS } from '@/types/interfaces';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { getItemRoute } from '@/utils/get-route';
import DrawerBatch from '@/views/private/components/drawer-batch.vue';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';


const props = withDefaults(
	defineProps<{
		value?: (number | string | Record<string, any>)[] | Record<string, any>;
		primaryKey: string | number;
		collection: string;
		field: string;
		width: string;
		disabled?: boolean;
		nonEditable?: boolean;
		version: ContentVersion | null;
		layout?: LAYOUTS;
		tableSpacing?: 'compact' | 'cozy' | 'comfortable';
		fields?: Array<string>;
		template?: string | null;
		enableCreate?: boolean;
		enableSelect?: boolean;
		filter?: Filter | null;
		enableSearchFilter?: boolean;
		enableLink?: boolean;
		limit?: number;
		sort?: string;
		sortDirection?: '+' | '-';
	}>(),
	{
		value: () => [],
		layout: LAYOUTS.LIST,
		tableSpacing: 'cozy',
		fields: () => ['id'],
		template: null,
		disabled: false,
		nonEditable: false,
		enableCreate: true,
		enableSelect: true,
		filter: null,
		enableSearchFilter: false,
		enableLink: false,
		limit: 15,
	},
);

const emit = defineEmits(['input']);
const { collection, field, primaryKey, version } = toRefs(props);
const { relationInfo } = useRelationO2M(collection, field);
const fieldsStore = useFieldsStore();

const value = computed({
	get: () => props.value,
	set: (val) => emit('input', val),
});

const templateWithDefaults = computed(() => {
	return (
		props.template ||
		relationInfo.value?.relatedCollection.meta?.display_template ||
		`{{${relationInfo.value?.relatedPrimaryKeyField.field}}}`
	);
});

const fields = computed(() => {
	if (!relationInfo.value) return [];

	let displayFields: string[] = [];

	if (props.layout === LAYOUTS.TABLE) {
		displayFields = adjustFieldsForDisplays(props.fields, relationInfo.value.relatedCollection.collection);
	} else {
		displayFields = adjustFieldsForDisplays(
			getFieldsFromTemplate(templateWithDefaults.value),
			relationInfo.value.relatedCollection.collection,
		);
	}

	return addRelatedPrimaryKeyToFields(relationInfo.value.relatedCollection.collection, displayFields);
});

const displayCollection = computed(() => relationInfo.value?.relatedCollection.collection);

const manualSort = ref<Sort | null>(
	props.sort && !relationInfo.value?.sortField ? { by: props.sort, desc: props.sortDirection === '-' } : null,
);

const listRelation = useListRelation({
	value,
	relationInfo,
	primaryKey,
	version,
	displayCollection,
	fieldKeys: computed(() => props.fields ?? []),
	fields,
	initialLimit: props.limit ?? 15,
	tableSpacing: computed(() => props.tableSpacing ?? 'cozy'),
	filter: computed(() => props.filter ?? null),
	sortRef: manualSort,
});

const {
	limit: limitFromRelation,
	page,
	search,
	searchFilter,
	displayItems,
	totalItemCount,
	loading,
	selected,
	isItemSelected,
	isLocalItem,
	getItemEdits,
	pageCount,
	showingCount,
	headers,
	tableRowHeight,
	allowDrag,
	deleteItem,
	parsedFilter,
	create,
	update,
	select,
} = listRelation;

const { createAllowed, deleteAllowed, updateAllowed } = useRelationPermissionsO2M(relationInfo);

function sortItems(items: DisplayItem[]) {
	const info = relationInfo.value;
	const sortField = info?.sortField;
	if (!info || !sortField) return;

	const sortedItems = items.map((item, index) => {
		const relatedId = item?.[info.relatedPrimaryKeyField.field];

		const changes: Record<string, any> = {
			$index: item.$index,
			$type: item.$type,
			$edits: item.$edits,
			...getItemEdits(item),
			[sortField]: index + 1,
		};

		if (!isNil(relatedId)) {
			changes[info.relatedPrimaryKeyField.field] = relatedId;
		}

		return changes;
	});

	update(...sortedItems);
}

const selectedPrimaryKeys = computed(() => {
	if (!relationInfo.value) return [];

	const relatedPkField = relationInfo.value.relatedPrimaryKeyField.field;

	return selected.value.map((item) => item[relatedPkField]);
});

const currentlyEditing = ref<string | null>(null);
const selectModalActive = ref(false);
const editsAtStart = ref<Record<string, any>>({});
let newItem = false;

function createItem() {
	currentlyEditing.value = '+';
	editsAtStart.value = {};
	newItem = true;
}

function editItem(item: DisplayItem) {
	if (!relationInfo.value) return;

	const relatedPkField = relationInfo.value.relatedPrimaryKeyField.field;

	newItem = false;
	editsAtStart.value = getItemEdits(item);

	if (item?.$type === 'created' && !isItemSelected(item)) {
		currentlyEditing.value = '+';
	} else {
		currentlyEditing.value = item[relatedPkField];
	}
}

function editRow({ item }: { item: DisplayItem }) {
	editItem(item);
}

function stageEdits(item: Record<string, any>) {
	if (newItem) {
		create(item);
	} else {
		update(item);
	}
}

function cancelEdit() {
	currentlyEditing.value = null;
}

const batchEditActive = ref(false);
const selection = ref<DisplayItem[]>([]);

const selectedKeys = computed(() => {
	if (!relationInfo.value) return [];

	return selection.value
		.map(
			// use `$index` for newly created items that don’t have a PK yet
			(item) => item[relationInfo.value!.relatedPrimaryKeyField.field] ?? item.$index ?? null,
		)
		.filter((key) => !isNil(key));
});

function stageBatchEdits(edits: Record<string, any>) {
	if (!relationInfo.value) return;

	const relatedPkField = relationInfo.value.relatedPrimaryKeyField.field;

	for (const item of selection.value) {
		const relatedId = get(item, [relatedPkField], null);

		const changes: Record<string, any> = {
			$index: item.$index,
			$type: item.$type,
			$edits: item.$edits,
			...getItemEdits(item),
			...edits,
		};

		if (relatedId !== null) {
			changes[relatedPkField] = relatedId;
		}

		update(changes);
	}

	selection.value = [];
}

const customFilter = computed(() => {
	const filter: Filter = {
		_and: [],
	};

	if (parsedFilter.value) filter._and.push(parsedFilter.value);

	if (!relationInfo.value) return filter;

	const selectFilter: Filter = {
		_or: [
			{
				[relationInfo.value.reverseJunctionField.field]: {
					_neq: props.primaryKey,
				},
			},
			{
				[relationInfo.value.reverseJunctionField.field]: {
					_null: true,
				},
			},
		],
	};

	if (selectedPrimaryKeys.value.length > 0) {
		filter._and.push({
			[relationInfo.value.relatedPrimaryKeyField.field]: {
				_nin: selectedPrimaryKeys.value,
			},
		});
	}

	if (props.primaryKey !== '+') filter._and.push(selectFilter);

	return filter;
});

function getLinkForItem(item: DisplayItem) {
	if (relationInfo.value) {
		const primaryKey = get(item, relationInfo.value.relatedPrimaryKeyField.field);

		return getItemRoute(relationInfo.value.relatedCollection.collection, primaryKey);
	}

	return null;
}

const {
    onUpdateSearch,
    onUpdateSearchFilter,
    onUpdateSort,
    onUpdateHeaders,
    onUpdateSelection,
    onUpdatePage,
    onUpdateLimit,
} = useListHandlers({
    search,
    searchFilter,
    sort: manualSort,
    headers,
    selection,
    page,
    limit: limitFromRelation,
});

const hasSatisfiedUniqueConstraint = computed(() => {
	if (!relationInfo.value) return false;

	const parentCollection = relationInfo.value.relation.related_collection;
	const relatedCollection = relationInfo.value.relatedCollection.collection;

	// Find all M2O fields in the related collection that point to the parent collection and are unique
	const m2oFields = fieldsStore.getFieldsForCollection(relatedCollection).filter((field) => {
		const schema = field.schema;
		return schema?.foreign_key_table === parentCollection && schema?.is_unique === true;
	});

	return m2oFields.length > 0 && totalItemCount.value > 0;
});
</script>

<template>
	<VNotice v-if="!relationInfo" type="warning">
		{{ $t('relationship_not_setup') }}
	</VNotice>
	<VNotice v-else-if="relationInfo.relatedCollection.meta?.singleton" type="warning">
		{{ $t('no_singleton_relations') }}
	</VNotice>
	<div v-else class="one-to-many">
		<ListRelationLayout
			:layout="layout"
			:width="width"
			:disabled="disabled"
			:non-editable="nonEditable"
			:total-item-count="totalItemCount"
			:showing-count="showingCount"
			:page-count="pageCount"
			:loading="loading"
			:display-items="displayItems"
			:headers="headers"
			:table-row-height="tableRowHeight"
			:limit="limit"
			:page="page"
			:allow-drag="allowDrag"
			:enable-search-filter="enableSearchFilter"
			:enable-link="enableLink"
			:display-collection="relationInfo.relatedCollection.collection"
			:item-key="relationInfo.relatedPrimaryKeyField.field"
			:sort-field="relationInfo?.sortField"
			:sort="manualSort"
			:template-for-list="templateWithDefaults"
			:show-batch-edit="updateAllowed && selectedKeys.length > 0"
			:show-select-button="enableSelect && updateAllowed"
			:show-create-button="enableCreate && createAllowed"
			:show-create-in-list="enableCreate && createAllowed && !hasSatisfiedUniqueConstraint"
			:show-select-in-list="enableSelect && updateAllowed && !hasSatisfiedUniqueConstraint"
			:show-manual-sort="allowDrag && !disabled"
			:show-select="!disabled && updateAllowed ? 'multiple' : 'none'"
			:delete-allowed="deleteAllowed"
			:relation-info="relationInfo"
			:search="search"
			:search-filter="searchFilter"
			:enable-create="enableCreate"
			:selection="selection"
			:get-link-for-item="getLinkForItem"
			:get-item-edits="getItemEdits"
			:is-local-item="isLocalItem"
			:delete-item="deleteItem"
			@update:search="onUpdateSearch"
			@update:search-filter="onUpdateSearchFilter"
			@update:sort="onUpdateSort"
			@update:headers="onUpdateHeaders"
			@update:selection="onUpdateSelection"
			@update:page="onUpdatePage"
			@update:limit="onUpdateLimit"
			@click:row="editRow"
			@update:items="sortItems"
			@batch-edit="batchEditActive = true"
			@open-select="selectModalActive = true"
			@create="createItem"
		/>

		<DrawerItem
			:disabled="disabled"
			:non-editable="nonEditable"
			:active="currentlyEditing !== null"
			:collection="relationInfo.relatedCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			:circular-field="relationInfo.reverseJunctionField.field"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<DrawerCollection
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="relationInfo.relatedCollection.collection"
			:filter="customFilter"
			multiple
			@input="select"
		/>

		<DrawerBatch
			v-model:active="batchEditActive"
			:primary-keys="selectedKeys"
			:collection="relationInfo.relatedCollection.collection"
			stage-on-save
			@input="stageBatchEdits"
		/>
	</div>
</template>

<style lang="scss">
.one-to-many {
	.bordered {
		.render-template {
			line-height: 1;
		}

		.no-last-border {
			tr.table-row:last-child td {
				border-block-end: none;
			}
		}

		tr.table-row {
			.append {
				position: sticky;
				inset-inline-end: 0;
				background: var(--theme--background);
				border-inline-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
			}
		}

		.disabled tr.table-row .append {
			background: var(--theme--background-subdued);
		}
	}
}
</style>

