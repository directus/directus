<script setup lang="ts">
import type { ContentVersion, Filter } from '@directus/types';
import { deepMap, getFieldsFromTemplate } from '@directus/utils';
import { clamp, get, isEmpty, isNil, merge, set } from 'lodash';
import { render } from 'micromustache';
import { computed, inject, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import Draggable from 'vuedraggable';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VNotice from '@/components/v-notice.vue';
import VPagination from '@/components/v-pagination.vue';
import VRemove from '@/components/v-remove.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { Sort } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import { useRelationM2M } from '@/composables/use-relation-m2m';
import { DisplayItem, RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';
import { useRelationPermissionsM2M } from '@/composables/use-relation-permissions';
import { useFieldsStore } from '@/stores/fields';
import { LAYOUTS } from '@/types/interfaces';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { formatItemsCountPaginated } from '@/utils/format-items-count';
import { getItemRoute } from '@/utils/get-route';
import { parseFilter } from '@/utils/parse-filter';
import { transformTemplateVariablesWithPath } from '@/utils/transform-template-variables-with-path';
import DrawerBatch from '@/views/private/components/drawer-batch.vue';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import RenderTemplate from '@/views/private/components/render-template.vue';
import SearchInput from '@/views/private/components/search-input.vue';

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
const { t, n } = useI18n();
const { collection, field, primaryKey, version } = toRefs(props);
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

	const relatedDisplayTemplate = relationInfo.value.relatedCollection.meta?.display_template;

	if (relatedDisplayTemplate) {
		return transformTemplateVariablesWithPath(relatedDisplayTemplate, [relationInfo.value.relation.field]);
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

const limit = ref(props.limit);
const page = ref(1);
const search = ref('');
const searchFilter = ref<Filter>();
const sort = ref<Sort>();
const junctionFilter = ref<Filter | null>(props.junctionFilter ?? null);

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

	if (junctionFilter.value) {
		if (q.filter) {
			q.filter = { _and: [q.filter, junctionFilter.value] };
		} else {
			q.filter = junctionFilter.value;
		}
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
} = useRelationMultiple(value, query, relationInfo, primaryKey, version);

const { createAllowed, updateAllowed, deleteAllowed, selectAllowed } = useRelationPermissionsM2M(relationInfo);

const pageCount = computed(() => Math.ceil(totalItemCount.value / limit.value));

const showingCount = computed(() =>
	formatItemsCountPaginated({
		currentItems: totalItemCount.value,
		currentPage: page.value,
		perPage: limit.value,
		isFiltered: !!(search.value || searchFilter.value),
		i18n: { t, n },
	}),
);

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
					width: contentWidth[key] !== undefined && contentWidth[key] < 10 ? contentWidth[key] * 16 + 10 : 160,
					sortable: !['json'].includes(field.type),
				};
			})
			.filter((key) => key !== null);
	},
	{
		immediate: true,
	},
);

const spacings = {
	compact: 32,
	cozy: 48,
	comfortable: 64,
};

const tableRowHeight = computed(() => spacings[props.tableSpacing] ?? spacings.cozy);

const allowDrag = computed(() => totalItemCount.value <= limit.value && relationInfo.value?.sortField !== undefined);

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
		}),
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

		return getItemRoute(relationInfo.value.relatedCollection.collection, primaryKey);
	}

	return null;
}

const menuActive = computed(() => editModalActive.value || selectModalActive.value || batchEditActive.value);
</script>

<template>
	<VNotice v-if="!relationInfo" type="warning">
		{{ $t('relationship_not_setup') }}
	</VNotice>
	<VNotice v-else-if="relationInfo.relatedCollection.meta?.singleton" type="warning">
		{{ $t('no_singleton_relations') }}
	</VNotice>
	<div v-else v-prevent-focusout="menuActive" class="many-to-many">
		<div :class="[`layout-${layout}`, { bordered: layout === LAYOUTS.TABLE, disabled, 'non-editable': nonEditable }]">
			<div v-if="layout === LAYOUTS.TABLE" class="actions top" :class="width">
				<div class="spacer" />

				<div v-if="totalItemCount" class="item-count">
					{{ showingCount }}
				</div>

				<template v-if="!nonEditable">
					<div v-if="enableSearchFilter && (totalItemCount > 10 || search || searchFilter)" class="search">
						<SearchInput
							v-model="search"
							v-model:filter="searchFilter"
							:collection="relationInfo.junctionCollection.collection"
							:disabled
						/>
					</div>

					<VButton
						v-if="updateAllowed && selectedKeys.length"
						v-tooltip.bottom="$t('edit')"
						rounded
						icon
						secondary
						:disabled
						@click="batchEditActive = true"
					>
						<VIcon name="edit" outline />
					</VButton>

					<VButton
						v-if="enableSelect && selectAllowed"
						v-tooltip.bottom="selectAllowed ? $t('add_existing') : $t('not_allowed')"
						rounded
						icon
						:secondary="enableCreate"
						:disabled
						@click="selectModalActive = true"
					>
						<VIcon name="playlist_add" />
					</VButton>

					<VButton
						v-if="enableCreate && createAllowed && selectAllowed"
						v-tooltip.bottom="createAllowed ? $t('create_item') : $t('not_allowed')"
						rounded
						icon
						:disabled
						@click="createItem"
					>
						<VIcon name="add" />
					</VButton>
				</template>
			</div>

			<VTable
				v-if="layout === LAYOUTS.TABLE"
				v-model:sort="sort"
				v-model:headers="headers"
				v-model="selection"
				:class="{ 'no-last-border': totalItemCount <= 10 }"
				:disabled="disabled && !nonEditable"
				:loading="loading"
				:items="displayItems"
				:item-key="relationInfo.junctionPrimaryKeyField.field"
				:row-height="tableRowHeight"
				:show-manual-sort="!disabled && allowDrag"
				:manual-sort-key="relationInfo?.sortField"
				:show-select="!disabled && updateAllowed ? 'multiple' : 'none'"
				show-resize
				@click:row="editRow"
				@update:items="sortItems"
			>
				<template v-for="header in headers" :key="header.value" #[`item.${header.value}`]="{ item }">
					<RenderTemplate
						:title="header.value"
						:collection="relationInfo.junctionCollection.collection"
						:item="item"
						:template="`{{${header.value}}}`"
					/>
				</template>

				<template v-if="!nonEditable" #item-append="{ item }">
					<div class="item-actions">
						<RouterLink v-if="enableLink" v-slot="{ href, navigate }" :to="getLinkForItem(item)!" custom>
							<VIcon v-if="disabled || item.$type === 'created'" name="launch" />

							<a
								v-else
								v-tooltip="$t('navigate_to_item')"
								:href="href"
								class="item-link"
								@click.stop="navigate"
								@keydown.stop
							>
								<VIcon name="launch" />
							</a>
						</RouterLink>

						<VRemove
							v-if="deleteAllowed || isLocalItem(item)"
							:disabled
							:class="{ deleted: item.$type === 'deleted' }"
							:item-type="item.$type"
							:item-info="relationInfo"
							:item-is-local="isLocalItem(item)"
							:item-edits="getItemEdits(item)"
							@action="deleteItem(item)"
							@keydown.stop
						/>
					</div>
				</template>
			</VTable>

			<template v-else-if="loading">
				<VSkeletonLoader
					v-for="num in clamp(totalItemCount - (page - 1) * limit, 1, limit)"
					:key="num"
					:type="totalItemCount > 4 ? 'block-list-item-dense' : 'block-list-item'"
				/>
			</template>

			<template v-else>
				<VNotice v-if="displayItems.length === 0">
					{{ $t('no_items') }}
				</VNotice>

				<Draggable
					:model-value="displayItems"
					tag="v-list"
					item-key="id"
					handle=".drag-handle"
					:disabled="disabled || !allowDrag"
					v-bind="{ 'force-fallback': true }"
					@update:model-value="sortItems($event)"
				>
					<template #item="{ element }">
						<VListItem
							block
							clickable
							:dense="totalItemCount > 4"
							:class="{ deleted: element.$type === 'deleted' }"
							:disabled="disabled && !nonEditable"
							@click="editItem(element)"
						>
							<VIcon
								v-if="allowDrag && !nonEditable"
								name="drag_handle"
								class="drag-handle"
								left
								:disabled
								@click.stop="() => {}"
							/>

							<RenderTemplate
								:collection="relationInfo.junctionCollection.collection"
								:item="element"
								:template="templateWithDefaults ?? ''"
							/>

							<div class="spacer" />

							<div v-if="!nonEditable" class="item-actions">
								<RouterLink v-if="enableLink" v-slot="{ href, navigate }" :to="getLinkForItem(element)!" custom>
									<VIcon v-if="disabled || element.$type === 'created'" name="launch" />

									<a
										v-else
										v-tooltip="$t('navigate_to_item')"
										:href="href"
										class="item-link"
										@click.stop="navigate"
										@keydown.stop
									>
										<VIcon name="launch" />
									</a>
								</RouterLink>

								<VRemove
									v-if="deleteAllowed || isLocalItem(element)"
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

			<template v-if="layout === LAYOUTS.TABLE">
				<div v-if="pageCount > 1" class="actions">
					<VPagination
						v-model="page"
						:disabled="disabled && !nonEditable"
						:length="pageCount"
						:total-visible="width.includes('half') ? 1 : 2"
						show-first-last
					/>

					<div class="spacer" />

					<div v-if="loading === false" class="per-page">
						<span>{{ $t('per_page') }}</span>
						<VSelect
							v-model="limit"
							:disabled="disabled && !nonEditable"
							:items="['10', '20', '30', '50', '100']"
							inline
						/>
					</div>
				</div>
			</template>
			<template v-else>
				<div v-if="!nonEditable || pageCount > 1" class="actions">
					<template v-if="!nonEditable">
						<VButton v-if="enableCreate && createAllowed" :disabled="disabled" @click="createItem">
							{{ $t('create_new') }}
						</VButton>

						<VButton v-if="enableSelect && selectAllowed" :disabled="disabled" @click="selectModalActive = true">
							{{ $t('add_existing') }}
						</VButton>
					</template>

					<div class="spacer" />

					<VPagination
						v-if="pageCount > 1"
						v-model="page"
						:disabled="disabled && !nonEditable"
						:length="pageCount"
						:total-visible="2"
						show-first-last
					/>
				</div>
			</template>
		</div>

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

<style lang="scss" scoped>
@use '@/styles/mixins';

.layout-table.disabled:not(.non-editable) {
	background-color: var(--theme--background-subdued);
}

.bordered {
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	padding: var(--v-card-padding, 16px);
}

.v-table .deleted {
	color: var(--danger-75);
}

.v-list {
	@include mixins.list-interface($deleteable: true);
}

.v-list-item.disabled {
	--v-list-item-background-color: var(--theme--form--field--input--background-subdued);
}

.item-actions {
	@include mixins.list-interface-item-actions($item-link: true);
}

.actions {
	@include mixins.list-interface-actions($pagination: true);

	position: relative;
	z-index: 1;

	&.top {
		margin-block-start: 0;
	}

	.spacer {
		flex-grow: 1;
	}

	.search {
		position: relative;
		z-index: 1;
	}

	.item-count {
		color: var(--theme--form--field--input--foreground-subdued);
		white-space: nowrap;
	}

	&.half,
	&.half-right {
		flex-wrap: wrap;

		.search {
			inline-size: 100%;
			order: -1;

			:deep(.search-input),
			:deep(.search-badge) {
				inline-size: 100% !important;
			}
		}
	}
}

.per-page {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	inline-size: 120px;
	padding: 10px 0;
	margin-inline-end: 2px;
	color: var(--theme--form--field--input--foreground-subdued);

	span {
		inline-size: auto;
		margin-inline-end: 8px;
	}

	.v-select {
		color: var(--theme--form--field--input--foreground);

		:deep(.disabled) {
			color: var(--theme--foreground-subdued);
		}
	}
}
</style>
