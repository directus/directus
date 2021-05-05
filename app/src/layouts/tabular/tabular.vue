<template>
	<div class="layout-tabular">
		<portal to="layout-options">
			<div class="field">
				<div class="type-label">{{ $t('layouts.tabular.spacing') }}</div>
				<v-select
					v-model="tableSpacing"
					:items="[
						{
							text: $t('layouts.tabular.compact'),
							value: 'compact',
						},
						{
							text: $t('layouts.tabular.cozy'),
							value: 'cozy',
						},
						{
							text: $t('layouts.tabular.comfortable'),
							value: 'comfortable',
						},
					]"
				/>
			</div>

			<div class="field">
				<div class="type-label">{{ $t('layouts.tabular.fields') }}</div>
				<draggable v-model="activeFields" handle=".drag-handle" :set-data="hideDragImage" :force-fallback="true">
					<v-checkbox
						v-for="field in activeFields"
						v-model="fields"
						:key="field.field"
						:value="field.field"
						:label="field.name"
					>
						<template #append>
							<div class="spacer" />
							<v-icon @click.stop name="drag_handle" class="drag-handle" />
						</template>
					</v-checkbox>
				</draggable>

				<v-checkbox
					v-for="field in availableFields.filter((field) => fields.includes(field.field) === false)"
					v-model="fields"
					:key="field.field"
					:value="field.field"
					:label="field.name"
				/>
			</div>
		</portal>

		<portal to="sidebar">
			<filter-sidebar-detail v-model="_filters" :collection="collection" :loading="loading" />
		</portal>

		<portal to="actions:prepend">
			<transition name="fade">
				<span class="item-count" v-if="itemCount">
					{{ showingCount }}
				</span>
			</transition>
		</portal>

		<v-table
			v-model="_selection"
			v-if="loading || itemCount > 0"
			class="table"
			ref="table"
			fixed-header
			:show-select="readonly ? false : selection !== undefined"
			show-resize
			must-sort
			:sort="tableSort"
			:items="items"
			:loading="loading"
			:headers.sync="tableHeaders"
			:row-height="tableRowHeight"
			:server-sort="itemCount === limit || totalPages > 1"
			:item-key="primaryKeyField.field"
			:show-manual-sort="sortField !== null"
			:manual-sort-key="sortField"
			selection-use-keys
			@click:row="onRowClick"
			@update:sort="onSortChange"
			@manual-sort="changeManualSort"
		>
			<template v-for="header in tableHeaders" v-slot:[`item.${header.value}`]="{ item }">
				<render-display
					:key="header.value"
					:value="item[header.value]"
					:display="header.field.display"
					:options="header.field.displayOptions"
					:interface="header.field.interface"
					:interface-options="header.field.interfaceOptions"
					:type="header.field.type"
					:collection="collection"
					:field="header.field.field"
				/>
			</template>

			<template #footer>
				<div class="footer">
					<div class="pagination">
						<v-pagination
							v-if="totalPages > 1"
							:length="totalPages"
							:total-visible="7"
							show-first-last
							:value="page"
							@input="toPage"
						/>
					</div>

					<div v-if="loading === false && items.length >= 25" class="per-page">
						<span>{{ $t('per_page') }}</span>
						<v-select
							@input="limit = +$event"
							:value="`${limit}`"
							:items="['25', '50', '100', '250', '500', ' 1000']"
							inline
						/>
					</div>
				</div>
			</template>
		</v-table>

		<v-info v-else-if="error" type="danger" :title="$t('unexpected_error')" icon="error" center>
			{{ $t('unexpected_error_copy') }}

			<template #append>
				<v-error :error="error" />

				<v-button small @click="resetPresetAndRefresh" class="reset-preset">
					{{ $t('reset_page_preferences') }}
				</v-button>
			</template>
		</v-info>

		<slot v-else-if="itemCount === 0 && activeFilterCount > 0" name="no-results" />
		<slot v-else-if="itemCount === 0" name="no-items" />
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { defineComponent, PropType, ref, computed, inject, toRefs, Ref, watch } from '@vue/composition-api';

import { HeaderRaw, Item } from '@/components/v-table/types';
import { Field, Filter } from '@/types';
import router from '@/router';
import useSync from '@/composables/use-sync';
import { debounce, clone } from 'lodash';
import Draggable from 'vuedraggable';
import useCollection from '@/composables/use-collection';
import useItems from '@/composables/use-items';
import i18n from '@/lang';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import hideDragImage from '@/utils/hide-drag-image';
import useShortcut from '@/composables/use-shortcut';

type layoutOptions = {
	widths?: {
		[field: string]: number;
	};
	limit?: number;
	spacing?: 'comfortable' | 'cozy' | 'compact';
};

type layoutQuery = {
	fields?: string[];
	sort?: string;
};

export default defineComponent({
	components: { Draggable },
	props: {
		collection: {
			type: String,
			required: true,
		},
		selection: {
			type: Array as PropType<Item[]>,
			default: undefined,
		},
		layoutOptions: {
			type: Object as PropType<layoutOptions>,
			default: () => ({}),
		},
		layoutQuery: {
			type: Object as PropType<layoutQuery>,
			default: () => ({}),
		},
		filters: {
			type: Array as PropType<Filter[]>,
			default: () => [],
		},
		searchQuery: {
			type: String as PropType<string | null>,
			default: null,
		},
		selectMode: {
			type: Boolean,
			default: false,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		resetPreset: {
			type: Function as PropType<() => Promise<void>>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const table = ref<Vue>();
		const mainElement = inject('main-element', ref<Element | null>(null));

		const _selection = useSync(props, 'selection', emit);
		const _layoutOptions: Ref<any> = useSync(props, 'layoutOptions', emit);
		const _layoutQuery: Ref<any> = useSync(props, 'layoutQuery', emit);
		const _filters = useSync(props, 'filters', emit);
		const _searchQuery = useSync(props, 'searchQuery', emit);

		const { collection, searchQuery } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection, sortField } = useCollection(collection);

		const { sort, limit, page, fields, fieldsWithRelational } = useItemOptions();

		const { items, loading, error, totalPages, itemCount, totalCount, changeManualSort, getItems } = useItems(
			collection,
			{
				sort,
				limit,
				page,
				fields: fieldsWithRelational,
				filters: _filters,
				searchQuery: _searchQuery,
			}
		);

		const {
			tableSort,
			tableHeaders,
			tableRowHeight,
			onRowClick,
			onSortChange,
			activeFields,
			tableSpacing,
		} = useTable();

		const showingCount = computed(() => {
			if ((itemCount.value || 0) < (totalCount.value || 0)) {
				if (itemCount.value === 1) {
					return i18n.t('one_filtered_item');
				}
				return i18n.t('start_end_of_count_filtered_items', {
					start: i18n.n((+page.value - 1) * limit.value + 1),
					end: i18n.n(Math.min(page.value * limit.value, itemCount.value || 0)),
					count: i18n.n(itemCount.value || 0),
				});
			}
			if (itemCount.value === 1) {
				return i18n.t('one_item');
			}
			return i18n.t('start_end_of_count_items', {
				start: i18n.n((+page.value - 1) * limit.value + 1),
				end: i18n.n(Math.min(page.value * limit.value, itemCount.value || 0)),
				count: i18n.n(itemCount.value || 0),
			});
		});

		const activeFilterCount = computed(() => {
			let count = _filters.value.filter((filter) => !filter.locked).length;

			if (searchQuery.value && searchQuery.value.length > 0) count++;

			return count;
		});

		const availableFields = computed(() => {
			return fieldsInCollection.value.filter((field: Field) => field.meta?.special?.includes('no-data') !== true);
		});

		useShortcut(
			'meta+a',
			() => {
				_selection.value = clone(items.value).map((item: any) => item[primaryKeyField.value.field]);
			},
			table
		);

		return {
			_selection,
			table,
			tableHeaders,
			items,
			loading,
			error,
			totalPages,
			tableSort,
			onRowClick,
			onSortChange,
			tableRowHeight,
			page,
			toPage,
			itemCount,
			totalCount,
			fieldsInCollection,
			fields,
			limit,
			activeFields,
			tableSpacing,
			primaryKeyField,
			_filters,
			info,
			showingCount,
			sortField,
			changeManualSort,
			hideDragImage,
			activeFilterCount,
			refresh,
			resetPresetAndRefresh,
			availableFields,
		};

		async function resetPresetAndRefresh() {
			await props?.resetPreset?.();
			refresh();
		}

		function refresh() {
			getItems();
		}

		function toPage(newPage: number) {
			page.value = newPage;
			mainElement.value?.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}

		function useItemOptions() {
			const page = computed({
				get() {
					return _layoutQuery.value?.page || 1;
				},
				set(newPage: number) {
					_layoutQuery.value = {
						...(_layoutQuery.value || {}),
						page: newPage,
					};
				},
			});

			const sort = computed({
				get() {
					return _layoutQuery.value?.sort || primaryKeyField.value?.field;
				},
				set(newSort: string) {
					_layoutQuery.value = {
						...(_layoutQuery.value || {}),
						page: 1,
						sort: newSort,
					};
				},
			});

			const limit = computed({
				get() {
					return _layoutQuery.value?.limit || 25;
				},
				set(newLimit: number) {
					_layoutQuery.value = {
						...(_layoutQuery.value || {}),
						page: 1,
						limit: newLimit,
					};
				},
			});

			const fields = computed({
				get() {
					if (_layoutQuery.value?.fields) {
						// This shouldn't be the case, but double check just in case it's stored
						// differently in the DB from previous versions
						if (typeof _layoutQuery.value.fields === 'string') {
							return (_layoutQuery.value.fields as string).split(',');
						}

						if (Array.isArray(_layoutQuery.value.fields)) return _layoutQuery.value.fields;
					}

					const fields =
						_layoutQuery.value?.fields ||
						fieldsInCollection.value
							.filter((field: Field) => !!field.meta?.hidden === false)
							.slice(0, 4)
							.sort((a: Field, b: Field) => {
								if (a.field < b.field) return -1;
								else if (a.field > b.field) return 1;
								else return 1;
							})
							.map(({ field }: Field) => field);

					return fields;
				},
				set(newFields: string[]) {
					_layoutQuery.value = {
						...(_layoutQuery.value || {}),
						fields: newFields,
					};
				},
			});

			const fieldsWithRelational = computed(() => adjustFieldsForDisplays(fields.value, props.collection));

			return { sort, limit, page, fields, fieldsWithRelational };
		}

		function useTable() {
			const tableSort = computed(() => {
				if (sort.value?.startsWith('-')) {
					return { by: sort.value.substring(1), desc: true };
				} else {
					return { by: sort.value, desc: false };
				}
			});

			const localWidths = ref<{ [field: string]: number }>({});

			watch(
				() => _layoutOptions.value,
				() => {
					localWidths.value = {};
				}
			);

			const saveWidthsTolayoutOptions = debounce(() => {
				_layoutOptions.value = {
					...(_layoutOptions.value || {}),
					widths: localWidths.value,
				};
			}, 350);

			const activeFields = computed<Field[]>({
				get() {
					return fields.value
						.map((key) => fieldsInCollection.value.find((field: Field) => field.field === key))
						.filter((f) => f) as Field[];
				},
				set(val) {
					fields.value = val.map((field) => field.field);
				},
			});

			const tableHeaders = computed<HeaderRaw[]>({
				get() {
					return activeFields.value.map((field) => ({
						text: field.name,
						value: field.field,
						width: localWidths.value[field.field] || _layoutOptions.value?.widths?.[field.field] || null,
						field: {
							display: field.meta?.display,
							displayOptions: field.meta?.display_options,
							interface: field.meta?.interface,
							interfaceOptions: field.meta?.options,
							type: field.type,
							field: field.field,
						},
						sortable:
							['json', 'o2m', 'm2o', 'm2m', 'm2a', 'file', 'files', 'alias', 'presentation', 'translations'].includes(
								field.type
							) === false,
					}));
				},
				set(val) {
					const widths = {} as { [field: string]: number };

					val.forEach((header) => {
						if (header.width) {
							widths[header.value] = header.width;
						}
					});

					localWidths.value = widths;

					saveWidthsTolayoutOptions();
				},
			});

			const tableSpacing = computed({
				get() {
					return _layoutOptions.value?.spacing || 'cozy';
				},
				set(newSpacing: 'compact' | 'cozy' | 'comfortable') {
					_layoutOptions.value = {
						...(_layoutOptions.value || {}),
						spacing: newSpacing,
					};
				},
			});

			const tableRowHeight = computed<number>(() => {
				switch (tableSpacing.value) {
					case 'compact':
						return 32;
					case 'cozy':
					default:
						return 48;
					case 'comfortable':
						return 64;
				}
			});

			return {
				tableSort,
				tableHeaders,
				tableSpacing,
				tableRowHeight,
				onRowClick,
				onSortChange,
				activeFields,
				getFieldDisplay,
			};

			function onRowClick(item: Item) {
				if (props.readonly === true) return;

				if (props.selectMode || _selection.value?.length > 0) {
					(table.value as any).onItemSelected({
						item,
						value: _selection.value?.includes(item[primaryKeyField.value.field]) === false,
					});
				} else {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const primaryKey = item[primaryKeyField.value!.field];

					// eslint-disable-next-line @typescript-eslint/no-empty-function
					router.push(`/collections/${collection.value}/${encodeURIComponent(primaryKey)}`, () => {});
				}
			}

			function onSortChange(newSort: { by: string; desc: boolean }) {
				let sortString = newSort.by;
				if (newSort.desc === true) sortString = '-' + sortString;

				sort.value = sortString;
			}

			function getFieldDisplay(fieldKey: string) {
				const field = fieldsInCollection.value.find((field: Field) => field.field === fieldKey);

				if (field === undefined) return null;
				if (!field.meta?.display) return null;

				return {
					display: field.meta?.display,
					options: field.meta?.display_options,
				};
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.layout-tabular {
	display: contents;
	margin: var(--content-padding);
	margin-bottom: var(--content-padding-bottom);
}

.v-table {
	--v-table-sticky-offset-top: var(--layout-offset-top);

	display: contents;

	::v-deep > table {
		min-width: calc(100% - var(--content-padding)) !important;
		margin-left: var(--content-padding);

		tr {
			margin-right: var(--content-padding);
		}
	}
}

.footer {
	position: sticky;
	left: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 32px var(--content-padding);

	.pagination {
		display: inline-block;
	}

	.per-page {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		width: 240px;
		color: var(--foreground-subdued);

		span {
			width: auto;
			margin-right: 4px;
		}

		.v-select {
			color: var(--foreground-normal);
		}
	}
}

.v-checkbox {
	width: 100%;

	.spacer {
		flex-grow: 1;
	}
}

.drag-handle {
	--v-icon-color: var(--foreground-subdued);

	cursor: ns-resize;

	&:hover {
		--v-icon-color: var(--foreground-normal);
	}
}

.item-count {
	position: relative;
	display: none;
	margin: 0 8px;
	color: var(--foreground-subdued);
	white-space: nowrap;

	@include breakpoint(small) {
		display: inline;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}

.reset-preset {
	margin-top: 24px;
}
</style>
