<template>
	<v-notice v-if="!relationInfo" type="warning">{{ t('relationship_not_setup') }}</v-notice>
	<div v-else class="m2a-builder">
		<template v-if="loading">
			<v-skeleton-loader
				v-for="n in clamp(totalItemCount - (page - 1) * limit, 1, limit)"
				:key="n"
				:type="totalItemCount > 4 ? 'block-list-item-dense' : 'block-list-item'"
			/>
		</template>

		<v-list v-else>
			<v-notice v-if="displayItems.length === 0">{{ t('no_items') }}</v-notice>

			<draggable
				:force-fallback="true"
				:model-value="displayItems"
				item-key="$index"
				:set-data="hideDragImage"
				:disabled="!allowDrag"
				@update:model-value="sortItems"
			>
				<template #item="{ element }">
					<v-list-item
						v-if="hasAllowedCollection(element)"
						block
						:dense="totalItemCount > 4"
						:class="{ deleted: element.$type === 'deleted' }"
						clickable
						@click="editItem(element)"
					>
						<v-icon v-if="allowDrag" class="drag-handle" left name="drag_handle" @click.stop />
						<span class="collection">{{ getCollectionName(element) }}:</span>
						<render-template
							:collection="element[relationInfo.collectionField.field]"
							:template="templates[element[relationInfo.collectionField.field]]"
							:item="element[relationInfo.junctionField.field]"
						/>
						<div class="spacer" />
						<v-icon
							v-if="!disabled"
							class="clear-icon"
							:name="getDeselectIcon(element)"
							@click.stop="deleteItem(element)"
						/>
					</v-list-item>

					<v-list-item v-else block :class="{ deleted: element.$type === 'deleted' }">
						<v-icon class="invalid-icon" name="warning" left />
						<span>{{ t('invalid_item') }}</span>
						<div class="spacer" />
						<v-icon
							v-if="!disabled"
							class="clear-icon"
							:name="getDeselectIcon(element)"
							@click.stop="deleteItem(element)"
						/>
					</v-list-item>
				</template>
			</draggable>
		</v-list>

		<div class="actions">
			<v-menu v-if="enableCreate" :disabled="disabled" show-arrow>
				<template #activator="{ toggle }">
					<v-button :disabled="disabled" @click="toggle">
						{{ t('create_new') }}
						<v-icon name="arrow_drop_down" right />
					</v-button>
				</template>

				<v-list>
					<v-list-item
						v-for="availableCollection of relationInfo.allowedCollections"
						:key="availableCollection.collection"
						clickable
						@click="createItem(availableCollection.collection)"
					>
						<v-list-item-icon>
							<v-icon :name="availableCollection.icon" />
						</v-list-item-icon>
						<v-text-overflow :text="availableCollection.name" />
					</v-list-item>
				</v-list>
			</v-menu>

			<v-menu v-if="enableSelect" :disabled="disabled" show-arrow>
				<template #activator="{ toggle }">
					<v-button class="existing" :disabled="disabled" @click="toggle">
						{{ t('add_existing') }}
						<v-icon name="arrow_drop_down" right />
					</v-button>
				</template>

				<v-list>
					<v-list-item
						v-for="availableCollection of relationInfo.allowedCollections"
						:key="availableCollection.collection"
						clickable
						@click="selectingFrom = availableCollection.collection"
					>
						<v-list-item-icon>
							<v-icon :name="availableCollection.icon" />
						</v-list-item-icon>
						<v-text-overflow :text="availableCollection.name" />
					</v-list-item>
				</v-list>
			</v-menu>

			<v-pagination v-if="pageCount > 1" v-model="page" :length="pageCount" :total-visible="5" />
		</div>

		<drawer-collection
			v-if="!disabled && !!selectingFrom"
			multiple
			:active="!!selectingFrom"
			:collection="selectingFrom"
			:filter="customFilter"
			@input="select($event, selectingFrom ?? undefined)"
			@update:active="selectingFrom = null"
		/>

		<drawer-item
			:disabled="disabled"
			:active="editModalActive"
			:collection="relationInfo.junctionCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:related-primary-key="relatedPrimaryKey || '+'"
			:junction-field="relationInfo.junctionField.field"
			:edits="editsAtStart"
			:circular-field="relationInfo.reverseJunctionField.field"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>
	</div>
</template>

<script setup lang="ts">
import { useRelationM2A, useRelationMultiple, RelationQueryMultiple, DisplayItem } from '@/composables/use-relation';
import { Filter } from '@directus/shared/types';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import Draggable from 'vuedraggable';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { get, clamp } from 'lodash';
import { hideDragImage } from '@/utils/hide-drag-image';

const props = withDefaults(
	defineProps<{
		value?: (number | string | Record<string, any>)[] | Record<string, any>;
		primaryKey: string | number;
		collection: string;
		field: string;
		disabled?: boolean;
		enableCreate?: boolean;
		enableSelect?: boolean;
	}>(),
	{
		value: () => [],
		disabled: false,
		enableCreate: true,
		enableSelect: true,
	}
);

const emit = defineEmits(['input']);
const { t } = useI18n();
const { collection, field, primaryKey } = toRefs(props);
const { relationInfo } = useRelationM2A(collection, field);

const value = computed({
	get: () => props.value,
	set: (val) => {
		emit('input', val);
	},
});

const templates = computed(() => {
	if (!relationInfo.value) return {};
	const templates: Record<string, string> = {};

	for (const collection of relationInfo.value.allowedCollections) {
		const primaryKeyField = relationInfo.value.relationPrimaryKeyFields[collection.collection];
		templates[collection.collection] = collection.meta?.display_template || `{{${primaryKeyField?.field}}}`;
	}

	return templates;
});

const fields = computed(() => {
	if (!relationInfo.value) return [];
	const fields: string[] = [];

	for (const collection of relationInfo.value.allowedCollections) {
		fields.push(
			...adjustFieldsForDisplays(
				getFieldsFromTemplate(templates.value[collection.collection]),
				relationInfo.value?.junctionCollection.collection ?? ''
			).map((field) => `${relationInfo.value?.junctionField.field}:${collection.collection}.${field}`)
		);
	}

	return fields;
});

const limit = ref(15);
const page = ref(1);

const query = computed<RelationQueryMultiple>(() => ({
	fields: fields.value,
	limit: limit.value,
	page: page.value,
}));

const { create, update, remove, select, displayItems, totalItemCount, loading, selected, isItemSelected, localDelete } =
	useRelationMultiple(value, query, relationInfo, primaryKey);

const pageCount = computed(() => Math.ceil(totalItemCount.value / limit.value));

const allowDrag = computed(
	() => totalItemCount.value <= limit.value && relationInfo.value?.sortField !== undefined && !props.disabled
);

function getDeselectIcon(item: DisplayItem) {
	if (item.$type === 'deleted') return 'settings_backup_restore';
	if (localDelete(item)) return 'delete';
	return 'close';
}

function sortItems(items: DisplayItem[]) {
	const sortField = relationInfo.value?.sortField;
	if (!sortField) return;

	const sortedItems = items.map((item, index) => ({
		...item,
		[sortField]: index,
	}));
	update(...sortedItems);
}

const editModalActive = ref(false);
const currentlyEditing = ref<string | number | null>(null);
const relatedPrimaryKey = ref<string | number | null>(null);
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
		relationInfo.value.relationPrimaryKeyFields[item[relationInfo.value.collectionField.field]].field;
	const junctionPkField = relationInfo.value.junctionPrimaryKeyField.field;

	newItem = false;
	editsAtStart.value = item;

	editModalActive.value = true;

	if (item?.$type === 'created' && !isItemSelected(item)) {
		currentlyEditing.value = null;
		relatedPrimaryKey.value = null;
	} else {
		if (!relationPkField) return;
		currentlyEditing.value = get(item, [junctionPkField], null);
		relatedPrimaryKey.value = get(item, [junctionPkField, relationPkField], null);
	}
}

function stageEdits(item: Record<string, any>) {
	if (newItem) {
		create(item);
	} else {
		update(item);
	}
}

function cancelEdit() {
	editModalActive.value = false;
}

function deleteItem(item: DisplayItem) {
	if (
		page.value === Math.ceil(totalItemCount.value / limit.value) &&
		page.value !== Math.ceil((totalItemCount.value - 1) / limit.value)
	) {
		page.value = Math.max(1, page.value - 1);
	}

	remove(item);
}

function hasAllowedCollection(item: DisplayItem) {
	const info = relationInfo.value;
	if (!info) return false;
	return (
		info.allowedCollections.findIndex(
			(coll) => relationInfo && coll.collection === item[info.collectionField.field]
		) !== -1
	);
}

function getCollectionName(item: DisplayItem) {
	const info = relationInfo.value;
	if (!info) return false;
	return info.allowedCollections.find((coll) => coll.collection === item[info.collectionField.field])?.name;
}

const customFilter = computed(() => {
	const info = relationInfo.value;

	const filter: Filter = {
		_and: [],
	};

	if (!info || !selectingFrom.value) return filter;

	const reverseRelation = `$FOLLOW(${info.junctionCollection.collection},${info.junctionField.field},${info.collectionField.field})`;

	const selectFilter: Filter = {
		[reverseRelation]: {
			_none: {
				[relationInfo.value.reverseJunctionField.field]: {
					_eq: props.primaryKey,
				},
			},
		},
	};

	const junctionField = info.junctionField.field;

	const selectedPrimaryKeys = selected.value.reduce((acc, item) => {
		const relatedPKField = info.relationPrimaryKeyFields[item[info.collectionField.field]].field;
		if (item[info.collectionField.field] === selectingFrom.value) acc.push(item[junctionField][relatedPKField]);
		return acc;
	}, [] as (string | number)[]);

	if (selectedPrimaryKeys.length > 0)
		filter._and.push({
			[info.relationPrimaryKeyFields[selectingFrom.value].field]: {
				_nin: selectedPrimaryKeys,
			},
		});

	if (props.primaryKey !== '+') filter._and.push(selectFilter);

	return filter;
});
</script>

<style lang="scss" scoped>
.v-list {
	--v-list-padding: 0 0 4px;
}

.v-list-item {
	.collection {
		color: var(--primary);
		white-space: nowrap;
		margin-right: 1ch;
	}

	&.deleted {
		--v-list-item-border-color: var(--danger-25);
		--v-list-item-border-color-hover: var(--danger-50);
		--v-list-item-background-color: var(--danger-10);
		--v-list-item-background-color-hover: var(--danger-25);

		::v-deep(.v-icon) {
			color: var(--danger-75);
		}

		.collection {
			color: var(--danger);
		}
	}
}

.actions {
	margin-top: 8px;
	display: flex;
	gap: 8px;

	.v-pagination {
		margin-left: auto;

		::v-deep(.v-button) {
			display: inline-flex;
		}
	}
}

.existing {
	margin-left: 8px;
}

.drag-handle {
	cursor: grab;
}

.invalid {
	cursor: default;

	.invalid-icon {
		--v-icon-color: var(--danger);
	}
}

.clear-icon {
	--v-icon-color: var(--foreground-subdued);
	--v-icon-color-hover: var(--danger);

	margin-right: 8px;
	color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--danger);
	}
}

.launch-icon {
	color: var(--foreground-subdued);
}
</style>
