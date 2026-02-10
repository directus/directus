<script setup lang="ts">
import type { ContentVersion, Filter } from '@directus/types';
import { getFieldsFromTemplate } from '@directus/utils';
import { get, isEmpty, isNil, merge, set } from 'lodash';
import { computed, ref, toRefs } from 'vue';
import VNotice from '@/components/v-notice.vue';
import { Sort } from '@/components/v-table/types';
import { useListHandlers } from '@/composables/use-list-handlers';
import { useListRelation } from '@/composables/use-list-relation';
import { useRelationM2M } from '@/composables/use-relation-m2m';
import type { DisplayItem } from '@/composables/use-relation-multiple';
import { useRelationPermissionsM2M } from '@/composables/use-relation-permissions';
import ListRelationLayout from '@/interfaces/shared/list-relation-layout.vue';
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
		primaryKey: string | number | null;
		collection: string;
		field: string;
		width: string;
		version: ContentVersion | null;
		layout?: LAYOUTS;
		tableSpacing?: 'compact' | 'cozy' | 'comfortable';
		fields?: Array<string>;
		template?: string | null;
		disabled?: boolean;
		nonEditable?: boolean;
		enableCreate?: boolean;
		enableSelect?: boolean;
		filter?: Filter | null;
		enableSearchFilter?: boolean;
		enableLink?: boolean;
		limit?: number;
		allowDuplicates?: boolean;
		junctionFieldLocation?: string;
		junctionFilter?: Filter | null;
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
		allowDuplicates: false,
		junctionFieldLocation: 'bottom',
	},
);

const emit = defineEmits(['input']);
const { collection, field, primaryKey, version } = toRefs(props);
const { relationInfo } = useRelationM2M(collection, field);

const value = computed({
	get: () => props.value,
	set: (val) => emit('input', val),
});

const templateWithDefaults = computed(() => {
	if (!relationInfo.value) return null;

	if (props.template) return props.template;

	if (relationInfo.value.junctionCollection.meta?.display_template) {
		return relationInfo.value.junctionCollection.meta.display_template;
	}

	let relatedDisplayTemplate = relationInfo.value.relatedCollection.meta?.display_template;

	if (relatedDisplayTemplate) {
		const regex = /({{.*?}})/g;
		const parts = relatedDisplayTemplate.split(regex).filter((p) => p);

		for (const part of parts) {
			if (part.startsWith('{{') === false) continue;
			const key = part.replace(/{{/g, '').replace(/}}/g, '').trim();
			const newPart = `{{${relationInfo.value.relation.field}.${key}}}`;

			relatedDisplayTemplate = relatedDisplayTemplate.replace(part, newPart);
		}

		return relatedDisplayTemplate;
	}

	return `{{${relationInfo.value.relation.field}.${relationInfo.value.relatedPrimaryKeyField.field}}}`;
});

const fields = computed(() => {
	if (!relationInfo.value) return [];
	let displayFields: string[] = [];

	if (props.layout === LAYOUTS.TABLE) {
		displayFields = adjustFieldsForDisplays(props.fields, relationInfo.value.junctionCollection.collection);
	} else {
		displayFields = adjustFieldsForDisplays(
			getFieldsFromTemplate(templateWithDefaults.value),
			relationInfo.value.junctionCollection.collection,
		);
	}

	return addRelatedPrimaryKeyToFields(relationInfo.value.junctionCollection.collection, displayFields);
});

const displayCollection = computed(() => relationInfo.value?.junctionCollection.collection);
const sort = ref<Sort | null>(null);
const junctionFilter = ref<Filter | null>(props.junctionFilter ?? null);

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
	extraFilter: junctionFilter,
	sortRef: sort,
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

const { createAllowed, updateAllowed, deleteAllowed, selectAllowed } = useRelationPermissionsM2M(relationInfo);

function sortItems(items: DisplayItem[]) {
	const info = relationInfo.value;
	const sortField = info?.sortField;
	if (!info || !sortField) return;

	const sortedItems = items.map((item, index) => {
		const junctionId = item?.[info.junctionPrimaryKeyField.field];
		const relatedId = item?.[info.junctionField.field]?.[info.relatedPrimaryKeyField.field];

		const changes: Record<string, any> = {
			$index: item.$index,
			$type: item.$type,
			$edits: item.$edits,
			...getItemEdits(item),
			[sortField]: index + 1,
		};

		if (!isNil(junctionId)) {
			changes[info.junctionPrimaryKeyField.field] = junctionId;
		}

		if (!isNil(relatedId)) {
			set(changes, info.junctionField.field + '.' + info.relatedPrimaryKeyField.field, relatedId);
		}

		return changes;
	});

	update(...sortedItems);
}

const selectedPrimaryKeys = computed(() => {
	if (!relationInfo.value) return [];

	const junctionField = relationInfo.value.junctionField.field;
	const relatedPkField = relationInfo.value.relatedPrimaryKeyField.field;

	return selected.value.map((item) => item[junctionField][relatedPkField]);
});

const editModalActive = ref(false);
const currentlyEditing = ref<string | number | null>(null);
const relatedPrimaryKey = ref<string | number | null>(null);
const selectModalActive = ref(false);
const editsAtStart = ref<Record<string, any>>({});
let newItem = false;

function createItem() {
	currentlyEditing.value = null;
	relatedPrimaryKey.value = null;
	editsAtStart.value = {};
	newItem = true;
	editModalActive.value = true;
}

function editItem(item: DisplayItem) {
	if (!relationInfo.value) return;

	const relatedPkField = relationInfo.value.relatedPrimaryKeyField.field;
	const junctionField = relationInfo.value.junctionField.field;
	const junctionPkField = relationInfo.value.junctionPrimaryKeyField.field;

	editsAtStart.value = getItemEdits(item);
	newItem = false;
	editModalActive.value = true;

	if (item?.$type === 'created' && !isItemSelected(item)) {
		currentlyEditing.value = null;
		relatedPrimaryKey.value = null;
	} else {
		currentlyEditing.value = get(item, [junctionPkField], null);
		relatedPrimaryKey.value = get(item, [junctionField, relatedPkField], null);
	}
}

function editRow({ item }: { item: DisplayItem }) {
	editItem(item);
}

function stageEdits(item: Record<string, any>) {
	if (isEmpty(item)) return;

	if (newItem) {
		create(item);
	} else {
		update(item);
	}
}

const batchEditActive = ref(false);
const selection = ref<DisplayItem[]>([]);

const selectedKeys = computed(() => {
	if (!relationInfo.value) return [];

	return selection.value
		.map(
			// use `$index` for newly created items that don’t have a PK yet
			(item) => item[relationInfo.value!.junctionPrimaryKeyField.field] ?? item.$index ?? null,
		)
		.filter((key) => !isNil(key));
});

function stageBatchEdits(edits: Record<string, any>) {
	if (!relationInfo.value) return;

	const relatedPkField = relationInfo.value.relatedPrimaryKeyField.field;
	const junctionField = relationInfo.value.junctionField.field;
	const junctionPkField = relationInfo.value.junctionPrimaryKeyField.field;

	for (const item of selection.value) {
		const junctionId = get(item, [junctionPkField], null);
		const relatedId = get(item, [junctionField, relatedPkField], null);

		const changes: Record<string, any> = {
			$index: item.$index,
			$type: item.$type,
			$edits: item.$edits,
			...merge(getItemEdits(item), {
				[junctionField]: {
					...edits,
				},
			}),
		};

		if (junctionId !== null) {
			changes[junctionPkField] = junctionId;
		}

		if (relatedId !== null) {
			set(changes, [junctionField, relatedPkField], relatedId);
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

	if (!relationInfo.value || props.allowDuplicates) return filter;

	const reverseRelation = `$FOLLOW(${relationInfo.value.junctionCollection.collection},${relationInfo.value.junctionField.field})`;

	const selectFilter: Filter = {
		[reverseRelation]: {
			_none: {
				[relationInfo.value.reverseJunctionField.field]: {
					_eq: props.primaryKey,
				},
			},
		},
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
		const primaryKey = get(item, [
			relationInfo.value.junctionField.field,
			relationInfo.value.relatedPrimaryKeyField.field,
		]);

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
    sort,
    headers,
    selection,
    page,
    limit: limitFromRelation,
});

</script>

<template>
	<VNotice v-if="!relationInfo" type="warning">
		{{ $t('relationship_not_setup') }}
	</VNotice>
	<VNotice v-else-if="relationInfo.relatedCollection.meta?.singleton" type="warning">
		{{ $t('no_singleton_relations') }}
	</VNotice>
	<div v-else class="many-to-many">
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
			:display-collection="relationInfo.junctionCollection.collection"
			:item-key="relationInfo.junctionPrimaryKeyField.field"
			:sort-field="relationInfo?.sortField"
			:sort="sort"
			:template-for-list="templateWithDefaults ?? ''"
			:show-batch-edit="updateAllowed && selectedKeys.length > 0"
			:show-select-button="enableSelect && selectAllowed"
			:show-create-button="enableCreate && createAllowed && selectAllowed"
			:select-button-tooltip="selectAllowed ? $t('add_existing') : $t('not_allowed')"
			:create-button-tooltip="createAllowed ? $t('create_item') : $t('not_allowed')"
			:show-create-in-list="enableCreate && createAllowed"
			:show-select-in-list="enableSelect && selectAllowed"
			:show-manual-sort="!disabled && allowDrag"
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
			v-model:active="editModalActive"
			:disabled="disabled"
			:non-editable="nonEditable"
			:collection="relationInfo.junctionCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:related-primary-key="relatedPrimaryKey || '+'"
			:junction-field="relationInfo.junctionField.field"
			:edits="editsAtStart"
			:circular-field="relationInfo.reverseJunctionField.field"
			:junction-field-location="junctionFieldLocation"
			@input="stageEdits"
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
.many-to-many {
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

