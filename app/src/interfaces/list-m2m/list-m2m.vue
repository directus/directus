<template>
	<v-notice v-if="!relationInfo" type="warning">
		{{ t('relationship_not_setup') }}
	</v-notice>
	<v-notice v-else-if="relationInfo.relatedCollection.meta?.singleton" type="warning">
		{{ t('no_singleton_relations') }}
	</v-notice>
	<div v-else class="many-to-many">
		<div :class="[`layout-${layout}`, { bordered: layout === LAYOUTS.TABLE }]">
			<div v-if="layout === LAYOUTS.TABLE" class="actions" :class="width">
				<div class="spacer" />

				<div v-if="totalItemCount" class="item-count">
					{{ showingCount }}
				</div>

				<div v-if="enableSearchFilter && (totalItemCount > 10 || search || searchFilter)" class="search">
					<search-input
						v-model="search"
						v-model:filter="searchFilter"
						:collection="relationInfo.junctionCollection.collection"
					/>
				</div>

				<v-button
					v-if="!disabled && enableSelect && selectAllowed"
					v-tooltip.bottom="selectAllowed ? t('add_existing') : t('not_allowed')"
					rounded
					icon
					:secondary="enableCreate"
					@click="selectModalActive = true"
				>
					<v-icon name="playlist_add" />
				</v-button>

				<v-button
					v-if="!disabled && enableCreate && createAllowed && selectAllowed"
					v-tooltip.bottom="createAllowed ? t('create_item') : t('not_allowed')"
					rounded
					icon
					@click="createItem"
				>
					<v-icon name="add" />
				</v-button>
			</div>

			<v-table
				v-if="layout === LAYOUTS.TABLE"
				v-model:sort="sort"
				v-model:headers="headers"
				:class="{ 'no-last-border': totalItemCount <= 10 }"
				:loading="loading"
				:items="displayItems"
				:row-height="tableRowHeight"
				:disabled="!updateAllowed"
				:show-manual-sort="allowDrag"
				:manual-sort-key="relationInfo?.sortField"
				show-resize
				@click:row="editRow"
				@update:items="sortItems"
			>
				<template v-for="header in headers" :key="header.value" #[`item.${header.value}`]="{ item }">
					<render-template
						:title="header.value"
						:collection="relationInfo.junctionCollection.collection"
						:item="item"
						:template="`{{${header.value}}}`"
					/>
				</template>

				<template #item-append="{ item }">
					<router-link
						v-if="enableLink"
						v-tooltip="t('navigate_to_item')"
						:to="getLinkForItem(item)!"
						class="item-link"
						:class="{ disabled: item.$type === 'created' }"
					>
						<v-icon name="launch" />
					</router-link>

					<v-icon
						v-if="!disabled && (deleteAllowed || isLocalItem(item))"
						v-tooltip="t(getDeselectTooltip(item))"
						class="deselect"
						:class="{ deleted: item.$type === 'deleted' }"
						:name="getDeselectIcon(item)"
						@click.stop="deleteItem(item)"
					/>
				</template>
			</v-table>

			<template v-else-if="loading">
				<v-skeleton-loader
					v-for="n in clamp(totalItemCount - (page - 1) * limit, 1, limit)"
					:key="n"
					:type="totalItemCount > 4 ? 'block-list-item-dense' : 'block-list-item'"
				/>
			</template>

			<v-notice v-else-if="displayItems.length === 0">
				{{ t('no_items') }}
			</v-notice>

			<v-list v-else>
				<draggable
					:force-fallback="true"
					:model-value="displayItems"
					item-key="id"
					handle=".drag-handle"
					:disabled="!allowDrag"
					@update:model-value="sortItems($event)"
				>
					<template #item="{ element }">
						<v-list-item
							block
							clickable
							:disabled="disabled"
							:dense="totalItemCount > 4"
							:class="{ deleted: element.$type === 'deleted' }"
							@click="editItem(element)"
						>
							<v-icon v-if="allowDrag" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />
							<render-template
								:collection="relationInfo.junctionCollection.collection"
								:item="element"
								:template="templateWithDefaults"
							/>
							<div class="spacer" />

							<router-link
								v-if="enableLink"
								v-tooltip="t('navigate_to_item')"
								:to="getLinkForItem(element)!"
								class="item-link"
								:class="{ disabled: element.$type === 'created' }"
								@click.stop
							>
								<v-icon name="launch" />
							</router-link>
							<v-icon
								v-if="!disabled && (deleteAllowed || isLocalItem(element))"
								v-tooltip="t(getDeselectTooltip(element))"
								class="deselect"
								:name="getDeselectIcon(element)"
								@click.stop="deleteItem(element)"
							/>
						</v-list-item>
					</template>
				</draggable>
			</v-list>

			<div class="actions" :class="layout">
				<template v-if="layout === LAYOUTS.TABLE">
					<template v-if="pageCount > 1">
						<v-pagination v-model="page" :length="pageCount" :total-visible="width.includes('half') ? 3 : 5" />

						<div class="spacer" />

						<div v-if="loading === false" class="per-page">
							<span>{{ t('per_page') }}</span>
							<v-select v-model="limit" :items="['10', '20', '30', '50', '100']" inline />
						</div>
					</template>
				</template>
				<template v-else>
					<v-button v-if="enableCreate && createAllowed" :disabled="disabled" @click="createItem">
						{{ t('create_new') }}
					</v-button>
					<v-button v-if="enableSelect && selectAllowed" :disabled="disabled" @click="selectModalActive = true">
						{{ t('add_existing') }}
					</v-button>
					<div class="spacer" />
					<v-pagination v-if="pageCount > 1" v-model="page" :length="pageCount" :total-visible="5" />
				</template>
			</div>
		</div>

		<drawer-item
			v-model:active="editModalActive"
			:disabled="disabled || (!updateAllowed && currentlyEditing !== null)"
			:collection="relationInfo.junctionCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:related-primary-key="relatedPrimaryKey || '+'"
			:junction-field="relationInfo.junctionField.field"
			:edits="editsAtStart"
			:circular-field="relationInfo.reverseJunctionField.field"
			:junction-field-location="junctionFieldLocation"
			@input="stageEdits"
		/>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="relationInfo.relatedCollection.collection"
			:filter="customFilter"
			multiple
			@input="select"
		/>
	</div>
</template>

<script setup lang="ts">
import { Sort } from '@/components/v-table/types';
import { useRelationM2M } from '@/composables/use-relation-m2m';
import { DisplayItem, RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';
import { useRelationPermissionsM2M } from '@/composables/use-relation-permissions';
import { useFieldsStore } from '@/stores/fields';
import { LAYOUTS } from '@/types/interfaces';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { formatCollectionItemsCount } from '@/utils/format-collection-items-count';
import { parseFilter } from '@/utils/parse-filter';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { Filter } from '@directus/types';
import { deepMap, getFieldsFromTemplate } from '@directus/utils';
import { clamp, get, isEmpty, isNil, set } from 'lodash';
import { render } from 'micromustache';
import { computed, inject, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';

const props = withDefaults(
	defineProps<{
		value?: (number | string | Record<string, any>)[] | Record<string, any>;
		primaryKey: string | number;
		collection: string;
		field: string;
		width: string;
		layout?: LAYOUTS;
		tableSpacing?: 'compact' | 'cozy' | 'comfortable';
		fields?: Array<string>;
		template?: string | null;
		disabled?: boolean;
		enableCreate?: boolean;
		enableSelect?: boolean;
		filter?: Filter | null;
		enableSearchFilter?: boolean;
		enableLink?: boolean;
		limit?: number;
		allowDuplicates?: boolean;
		junctionFieldLocation?: string;
	}>(),
	{
		value: () => [],
		layout: LAYOUTS.LIST,
		tableSpacing: 'cozy',
		fields: () => ['id'],
		template: () => null,
		disabled: false,
		enableCreate: true,
		enableSelect: true,
		filter: () => null,
		enableSearchFilter: false,
		enableLink: false,
		limit: 15,
		allowDuplicates: false,
		junctionFieldLocation: 'bottom',
	}
);

const emit = defineEmits(['input']);
const { t } = useI18n();
const { collection, field, primaryKey } = toRefs(props);
const { relationInfo } = useRelationM2M(collection, field);
const fieldsStore = useFieldsStore();

const value = computed({
	get: () => props.value,
	set: (val) => {
		emit('input', val);
	},
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
			relationInfo.value.junctionCollection.collection
		);
	}

	return addRelatedPrimaryKeyToFields(relationInfo.value.junctionCollection.collection, displayFields);
});

const limit = ref(props.limit);
const page = ref(1);
const search = ref('');
const searchFilter = ref<Filter>();
const sort = ref<Sort>();

const query = computed<RelationQueryMultiple>(() => {
	const q: RelationQueryMultiple = {
		limit: limit.value,
		page: page.value,
		fields: fields.value || ['id'],
	};

	if (!relationInfo.value) {
		return q;
	}

	if (searchFilter.value) {
		q.filter = searchFilter.value;
	}

	if (search.value) {
		q.search = search.value;
	}

	if (sort.value) {
		q.sort = [`${sort.value.desc ? '-' : ''}${sort.value.by}`];
	}

	return q;
});

watch([search, searchFilter, limit], () => {
	page.value = 1;
});

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
} = useRelationMultiple(value, query, relationInfo, primaryKey);

const pageCount = computed(() => Math.ceil(totalItemCount.value / limit.value));

const showingCount = computed(() => {
	return formatCollectionItemsCount(
		totalItemCount.value,
		page.value,
		limit.value,
		!!(search.value || searchFilter.value)
	);
});

const headers = ref<Array<any>>([]);

watch(
	[props, relationInfo, displayItems],
	() => {
		if (!relationInfo.value) {
			headers.value = [];
			return;
		}

		const junctionCollection = relationInfo.value.junctionCollection.collection;

		const contentWidth: Record<string, number> = {};

		(displayItems.value ?? []).forEach((item: Record<string, any>) => {
			props.fields.forEach((key) => {
				if (!contentWidth[key]) {
					contentWidth[key] = 5;
				}

				if (String(item[key]).length > contentWidth[key]) {
					contentWidth[key] = String(item[key]).length;
				}
			});
		});

		headers.value = props.fields
			.map((key) => {
				const field = fieldsStore.getField(junctionCollection, key);

				// when user has no permission to this field or junction collection
				if (!field) return null;

				return {
					text: field.name,
					value: key,
					width: contentWidth[key] < 10 ? contentWidth[key] * 16 + 10 : 160,
					sortable: !['json'].includes(field.type),
				};
			})
			.filter((key) => key !== null);
	},
	{ immediate: true }
);

const spacings = {
	compact: 32,
	cozy: 48,
	comfortable: 64,
};

const tableRowHeight = computed(() => spacings[props.tableSpacing] ?? spacings.cozy);

const allowDrag = computed(
	() => totalItemCount.value <= limit.value && relationInfo.value?.sortField !== undefined && !props.disabled
);

function getDeselectIcon(item: DisplayItem) {
	if (item.$type === 'deleted') return 'settings_backup_restore';
	if (isLocalItem(item)) return 'delete';
	return 'close';
}

function getDeselectTooltip(item: DisplayItem) {
	if (item.$type === 'deleted') return 'undo_removed_item';
	if (isLocalItem(item)) return 'delete_item';
	return 'remove_item';
}

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

function deleteItem(item: DisplayItem) {
	if (
		page.value === Math.ceil(totalItemCount.value / limit.value) &&
		page.value !== Math.ceil((totalItemCount.value - 1) / limit.value)
	) {
		page.value = Math.max(1, page.value - 1);
	}

	remove(item);
}

const values = inject('values', ref<Record<string, any>>({}));

const customFilter = computed(() => {
	const filter: Filter = {
		_and: [],
	};

	const customFilter = parseFilter(
		deepMap(props.filter, (val: any) => {
			if (val && typeof val === 'string') {
				return render(val, values.value);
			}

			return val;
		})
	);

	if (!isEmpty(customFilter)) filter._and.push(customFilter);

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

		return `/content/${relationInfo.value.relatedCollection.collection}/${encodeURIComponent(primaryKey)}`;
	}

	return null;
}

const { createAllowed, updateAllowed, deleteAllowed, selectAllowed } = useRelationPermissionsM2M(relationInfo);
</script>

<style lang="scss">
.many-to-many {
	.bordered {
		.render-template {
			line-height: 1;
		}

		.no-last-border {
			tr.table-row:last-child td {
				border-bottom: none;
			}
		}

		tr.table-row {
			.append {
				position: sticky;
				right: 0;
				border-left: var(--border-width) solid var(--border-subdued);
			}
		}
	}
}
</style>

<style lang="scss" scoped>
.bordered {
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius-outline);
	padding: var(--v-card-padding);
}

.v-list {
	margin-top: 8px;
	--v-list-padding: 0 0 4px;

	.v-list-item.deleted {
		--v-list-item-border-color: var(--danger-25);
		--v-list-item-border-color-hover: var(--danger-50);
		--v-list-item-background-color: var(--danger-10);
		--v-list-item-background-color-hover: var(--danger-25);

		::v-deep(.v-icon) {
			color: var(--danger-75);
		}
	}
}

.v-table {
	.deselect.deleted {
		color: var(--danger-75);
	}
}

.v-notice {
	margin-top: 8px;
}

.actions {
	display: flex;
	align-items: center;
	gap: var(--v-sheet-padding);

	.v-pagination {
		:deep(.v-button) {
			display: inline-flex;
		}
	}

	.table.v-pagination {
		margin-top: var(--v-sheet-padding);
	}

	.spacer {
		flex-grow: 1;
	}

	.search {
		position: relative;
		z-index: 1;
	}

	.item-count {
		color: var(--foreground-subdued);
		white-space: nowrap;
	}

	&.half,
	&.half-right {
		flex-wrap: wrap;

		.search {
			width: 100%;
			order: -1;

			:deep(.search-input),
			:deep(.search-badge) {
				width: 100% !important;
			}
		}
	}

	&.list {
		margin-top: 8px;
	}
}

.item-link {
	--v-icon-color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);
	margin: 0 4px;

	&:hover {
		--v-icon-color: var(--primary);
	}

	&.disabled {
		opacity: 0;
		pointer-events: none;
	}
}

.deselect {
	--v-icon-color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);
	margin: 0 4px;
	cursor: pointer;

	&:hover {
		--v-icon-color: var(--danger);
	}
}

.per-page {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	width: 120px;
	padding: 10px 0;
	margin-right: 2px;
	color: var(--foreground-subdued);

	span {
		width: auto;
		margin-right: 8px;
	}

	.v-select {
		color: var(--foreground-normal);
	}
}
</style>
