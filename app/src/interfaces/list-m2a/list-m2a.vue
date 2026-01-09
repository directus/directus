<script setup lang="ts">
import type { ContentVersion, Filter } from '@directus/types';
import { getFieldsFromTemplate } from '@directus/utils';
import { clamp, get, isEmpty, isNil, set } from 'lodash';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VNotice from '@/components/v-notice.vue';
import VPagination from '@/components/v-pagination.vue';
import VRemove from '@/components/v-remove.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { usePageSize } from '@/composables/use-page-size';
import { useRelationM2A } from '@/composables/use-relation-m2a';
import { DisplayItem, RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';
import { useRelationPermissionsM2A } from '@/composables/use-relation-permissions';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { hideDragImage } from '@/utils/hide-drag-image';
import { renderStringTemplate } from '@/utils/render-string-template';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import RenderTemplate from '@/views/private/components/render-template.vue';

const props = withDefaults(
	defineProps<{
		value?: (number | string | Record<string, any>)[] | Record<string, any>;
		primaryKey: string | number;
		collection: string;
		field: string;
		disabled?: boolean;
		nonEditable?: boolean;
		version: ContentVersion | null;
		enableCreate?: boolean;
		enableSelect?: boolean;
		limit?: number;
		prefix?: string;
		allowDuplicates?: boolean;
	}>(),
	{
		value: () => [],
		disabled: false,
		nonEditable: false,
		enableCreate: true,
		enableSelect: true,
		limit: 15,
		allowDuplicates: false,
	},
);

const emit = defineEmits(['input']);
const { t, te } = useI18n();
const { collection, field, primaryKey, limit, version } = toRefs(props);
const { relationInfo } = useRelationM2A(collection, field);

const value = computed({
	get: () => props.value,
	set: (val) => {
		emit('input', val);
	},
});

const allowedCollections = computed(() => {
	if (!relationInfo.value) return [];
	return relationInfo.value.allowedCollections.filter((collection) => collection.meta?.singleton !== true);
});

const templates = computed(() => {
	if (!relationInfo.value) return {};
	const templates: Record<string, string> = {};

	for (const collection of allowedCollections.value) {
		const primaryKeyField = relationInfo.value.relationPrimaryKeyFields[collection.collection];
		templates[collection.collection] = collection.meta?.display_template || `{{${primaryKeyField?.field}}}`;
	}

	return templates;
});

const fields = computed(() => {
	if (!relationInfo.value) return [];
	const fields: string[] = [];

	for (const collection of allowedCollections.value) {
		const displayFields: string[] = adjustFieldsForDisplays(
			getFieldsFromTemplate(templates.value[collection.collection]),
			collection.collection,
		).map((field) => `${relationInfo.value?.junctionField.field}:${collection.collection}.${field}`);

		fields.push(...addRelatedPrimaryKeyToFields(collection.collection, displayFields));
	}

	if (props.prefix) {
		fields.push(...getFieldsFromTemplate(props.prefix));
	}

	return fields;
});

const { sizes: pageSizes, selected: selectedPageSize } = usePageSize<string>(
	computed(() => [10, 25, 50, 100, limit.value].filter((v) => v >= limit.value).sort((a, b) => a - b)),
	(value) => String(value),
	limit.value,
);

const limitWritable = ref(selectedPageSize);
const pageCount = computed(() => Math.ceil(totalItemCount.value / limitWritable.value));
const page = ref(1);

watch(limitWritable, (newLimit, oldLimit) => {
	const offset = (page.value - 1) * oldLimit;
	page.value = Math.floor(offset / newLimit + 1);
});

const query = computed<RelationQueryMultiple>(() => ({
	fields: fields.value,
	limit: limitWritable.value,
	page: page.value,
}));

const {
	create,
	update,
	remove,
	select,
	displayItems,
	totalItemCount,
	loading,
	selected,
	isItemSelected,
	isLocalItem,
	getItemEdits,
} = useRelationMultiple(value, query, relationInfo, primaryKey, version);

function sortItems(items: DisplayItem[]) {
	const info = relationInfo.value;
	const sortField = info?.sortField;
	if (!info || !sortField) return;

	const sortedItems = items.map((item, index) => {
		const junctionId = item?.[info.junctionPrimaryKeyField.field];
		const collection = item?.[info.collectionField.field];
		const pkField = info.relationPrimaryKeyFields[collection]!.field;
		const relatedId = item?.[info.junctionField.field]?.[pkField];

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

		if (!isNil(collection)) {
			changes[info.collectionField.field] = collection;
		}

		if (!isNil(relatedId)) {
			set(changes, info.junctionField.field + '.' + pkField, relatedId);
		}

		return changes;
	});

	update(...sortedItems);
}

const editModalActive = ref(false);
const currentlyEditing = ref<string | number | null>(null);
const relatedPrimaryKey = ref<string | number | null>(null);
const editingCollection = ref<string | null>(null);
const selectingFrom = ref<string | null>(null);
const editsAtStart = ref<Record<string, any>>({});
let newItem = false;

function createItem(collection: string) {
	if (!relationInfo.value) return;

	currentlyEditing.value = null;
	relatedPrimaryKey.value = null;

	editsAtStart.value = {
		[relationInfo.value.collectionField.field]: collection,
		[relationInfo.value.junctionField.field]: {},
	};

	newItem = true;
	editModalActive.value = true;
}

function editItem(item: DisplayItem) {
	if (!relationInfo.value) return;

	const relationPkField =
		relationInfo.value.relationPrimaryKeyFields[item[relationInfo.value.collectionField.field]]!.field;

	const junctionField = relationInfo.value.junctionField.field;
	const junctionPkField = relationInfo.value.junctionPrimaryKeyField.field;

	newItem = false;

	editsAtStart.value = {
		...getItemEdits(item),
		[relationInfo.value.collectionField.field]: item[relationInfo.value.collectionField.field],
	};

	editModalActive.value = true;
	editingCollection.value = item[relationInfo.value.collectionField.field];

	if (item?.$type === 'created' && !isItemSelected(item)) {
		currentlyEditing.value = null;
		relatedPrimaryKey.value = null;
		editingCollection.value = null;
	} else {
		if (!relationPkField) return;
		currentlyEditing.value = get(item, [junctionPkField], null);
		relatedPrimaryKey.value = get(item, [junctionField, relationPkField], null);
	}
}

function stageEdits(item: Record<string, any>) {
	if (isEmpty(item)) return;

	if (newItem) {
		create(item);
	} else {
		update(item);
	}
}

function deleteItem(item: DisplayItem) {
	if (
		page.value === Math.ceil(totalItemCount.value / limitWritable.value) &&
		page.value !== Math.ceil((totalItemCount.value - 1) / limitWritable.value)
	) {
		page.value = Math.max(1, page.value - 1);
	}

	remove(item);
}

function hasAllowedCollection(item: DisplayItem) {
	const info = relationInfo.value;
	if (!info) return false;
	return (
		allowedCollections.value.findIndex(
			(coll) => relationInfo && coll.collection === item[info.collectionField.field],
		) !== -1
	);
}

function getPrefix(item: DisplayItem) {
	if (props.prefix) return renderStringTemplate(props.prefix, item).displayValue.value;

	const info = relationInfo.value;
	if (!info) return false;

	const collection = allowedCollections.value.find((coll) => coll.collection === item[info.collectionField.field]);

	if (te(`collection_names_singular.${collection?.collection}`)) {
		return t(`collection_names_singular.${collection?.collection}`);
	}

	if (te(`collection_names_plural.${collection?.collection}`)) {
		return t(`collection_names_plural.${collection?.collection}`);
	}

	return collection?.name;
}

const customFilter = computed(() => {
	const info = relationInfo.value;

	if (!info || !selectingFrom.value || props.allowDuplicates) return {};

	const filter: Filter = {
		_and: [],
	};

	const reverseRelation = `$FOLLOW(${info.junctionCollection.collection},${info.junctionField.field},${info.collectionField.field})`;

	const selectFilter = {
		[reverseRelation]: {
			_none: {
				_and: [
					{
						[relationInfo.value.reverseJunctionField.field]: {
							_eq: props.primaryKey,
						},
					},
					{
						[info.collectionField.field]: {
							_eq: unref(selectingFrom),
						},
					},
				],
			},
		},
	} as Filter;

	const junctionField = info.junctionField.field;

	const selectedPrimaryKeys = selected.value.reduce(
		(acc, item) => {
			const relatedPKField = info.relationPrimaryKeyFields[item[info.collectionField.field]]!.field;
			if (item[info.collectionField.field] === selectingFrom.value) acc.push(item[junctionField][relatedPKField]);
			return acc;
		},
		[] as (string | number)[],
	);

	if (selectedPrimaryKeys.length > 0) {
		filter._and.push({
			[info.relationPrimaryKeyFields[selectingFrom.value]!.field]: {
				_nin: selectedPrimaryKeys,
			},
		});
	}

	if (props.primaryKey !== '+') filter._and.push(selectFilter);

	return filter;
});

const { createAllowed, deleteAllowed, selectAllowed, updateAllowed } = useRelationPermissionsM2A(relationInfo);

const createCollections = computed(() => {
	const info = relationInfo.value;
	if (!info) return [];

	return info.allowedCollections.filter((collection) => {
		return createAllowed.value[collection.collection];
	});
});

const canDrag = computed(() => relationInfo.value?.sortField !== undefined && updateAllowed.value);
const allowDrag = computed(() => canDrag.value && totalItemCount.value <= limitWritable.value);
</script>

<template>
	<VNotice v-if="!relationInfo" type="warning">{{ $t('relationship_not_setup') }}</VNotice>
	<VNotice v-else-if="allowedCollections.length === 0" type="warning">{{ $t('no_singleton_relations') }}</VNotice>
	<div v-else class="m2a-builder">
		<VNotice v-if="!disabled && canDrag && !allowDrag">{{ $t('interfaces.list-m2a.sorting_disabled') }}</VNotice>
		<template v-if="loading">
			<VSkeletonLoader
				v-for="n in clamp(totalItemCount - (page - 1) * limitWritable, 1, limitWritable)"
				:key="n"
				:type="totalItemCount > 4 ? 'block-list-item-dense' : 'block-list-item'"
			/>
		</template>

		<template v-else>
			<VNotice v-if="displayItems.length === 0">{{ $t('no_items') }}</VNotice>

			<Draggable
				v-else
				:model-value="displayItems"
				tag="v-list"
				item-key="$index"
				:set-data="hideDragImage"
				:disabled="disabled || !allowDrag"
				v-bind="{ 'force-fallback': true }"
				handle=".drag-handle"
				@update:model-value="sortItems"
			>
				<template #item="{ element }">
					<VListItem
						v-if="hasAllowedCollection(element)"
						block
						:disabled="disabled && !nonEditable"
						:dense="totalItemCount > 4"
						:class="{ deleted: element.$type === 'deleted' }"
						clickable
						@click="editItem(element)"
					>
						<VIcon v-if="allowDrag && !nonEditable" class="drag-handle" left name="drag_handle" :disabled @click.stop />

						<span class="collection">{{ getPrefix(element) }}:</span>

						<RenderTemplate
							:collection="element[relationInfo.collectionField.field]"
							:template="templates[element[relationInfo.collectionField.field]]"
							:item="element[relationInfo.junctionField.field]"
						/>

						<div class="spacer" />

						<div v-if="!nonEditable" class="item-actions">
							<VRemove
								v-if="deleteAllowed[element[relationInfo.collectionField.field]] || isLocalItem(element)"
								:disabled
								:item-type="element.$type"
								:item-info="relationInfo"
								:item-is-local="isLocalItem(element)"
								:item-edits="getItemEdits(element)"
								@action="deleteItem(element)"
							/>
						</div>
					</VListItem>

					<VListItem
						v-else
						block
						:disabled="disabled && !nonEditable"
						:class="{ deleted: element.$type === 'deleted' }"
					>
						<VIcon class="invalid-icon" name="warning" left />

						<span>{{ $t('invalid_item') }}</span>

						<div class="spacer" />

						<div v-if="!nonEditable" class="item-actions">
							<VRemove
								:disabled
								:item-type="element.$type"
								:item-info="relationInfo"
								:item-is-local="isLocalItem(element)"
								:item-edits="getItemEdits(element)"
								@action="deleteItem(element)"
							/>
						</div>
					</VListItem>
				</template>
			</Draggable>
		</template>

		<div v-if="!nonEditable" class="actions">
			<VMenu v-if="enableCreate && createCollections.length > 0" :disabled="disabled" show-arrow>
				<template #activator="{ toggle }">
					<VButton :disabled="disabled" @click="toggle">
						{{ $t('create_new') }}
						<VIcon name="arrow_drop_down" right />
					</VButton>
				</template>

				<VList>
					<VListItem
						v-for="availableCollection of allowedCollections"
						:key="availableCollection.collection"
						clickable
						@click="createItem(availableCollection.collection)"
					>
						<VListItemIcon>
							<VIcon :name="availableCollection.icon" />
						</VListItemIcon>
						<VTextOverflow :text="availableCollection.name" />
					</VListItem>
				</VList>
			</VMenu>

			<VMenu v-if="enableSelect && selectAllowed" :disabled="disabled" show-arrow>
				<template #activator="{ toggle }">
					<VButton :disabled="disabled" @click="toggle">
						{{ $t('add_existing') }}
						<VIcon name="arrow_drop_down" right />
					</VButton>
				</template>

				<VList>
					<VListItem
						v-for="availableCollection of allowedCollections"
						:key="availableCollection.collection"
						clickable
						@click="selectingFrom = availableCollection.collection"
					>
						<VListItemIcon>
							<VIcon :name="availableCollection.icon" />
						</VListItemIcon>
						<VTextOverflow :text="availableCollection.name" />
					</VListItem>
				</VList>
			</VMenu>

			<div v-if="pageCount > 1 || limitWritable !== limit" class="pagination">
				<div v-if="pageSizes.length > 1" class="per-page">
					<span>{{ $t('per_page') }}</span>
					<VSelect
						:model-value="`${limitWritable}`"
						:items="pageSizes"
						inline
						@update:model-value="limitWritable = +$event"
					/>
				</div>

				<VPagination v-model="page" :length="pageCount" :total-visible="2" show-first-last />
			</div>
		</div>

		<DrawerCollection
			v-if="!disabled && selectingFrom"
			multiple
			:active="!!selectingFrom"
			:collection="selectingFrom"
			:filter="customFilter"
			@input="select($event!, selectingFrom ?? undefined)"
			@update:active="selectingFrom = null"
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
			@input="stageEdits"
		/>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list {
	@include mixins.list-interface($deleteable: true);

	.v-notice + & {
		margin-block-start: 12px;
	}
}

.v-list-item {
	.collection {
		white-space: nowrap;
		margin-inline-end: 1ch;
	}

	&:not(.disabled) .collection {
		color: var(--theme--primary);
	}

	&.deleted:not(.disabled) .collection {
		color: var(--theme--danger);
	}

	&.disabled {
		background-color: var(--theme--form--field--input--background-subdued);
	}
}

.item-actions {
	@include mixins.list-interface-item-actions;
}

.actions {
	@include mixins.list-interface-actions($pagination: true);

	.v-button {
		--v-button-padding: 0 12px 0 19px;
	}

	.pagination {
		margin-inline-start: auto;
		display: flex;
		gap: 8px 16px;

		.per-page {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			color: var(--theme--foreground-subdued);

			span {
				inline-size: auto;
				margin-inline-end: 4px;
			}

			.v-select {
				color: var(--theme--foreground);
			}
		}
	}
}

.invalid {
	cursor: default;

	.invalid-icon {
		--v-icon-color: var(--theme--danger);
	}
}

.launch-icon {
	color: var(--theme--form--field--input--foreground-subdued);
}
</style>
