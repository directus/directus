<template>
	<div class="layout-tabular">
		<portal to="drawer">
			<filter-drawer-detail v-model="_filters" :collection="collection" :loading="loading" />

			<drawer-detail icon="menu_open" :title="$t('layouts.tabular.fields')">
				<draggable v-model="activeFields" handle=".drag-handle">
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
					v-for="field in availableFields.filter(
						(field) => fields.includes(field.field) === false
					)"
					v-model="fields"
					:key="field.field"
					:value="field.field"
					:label="field.name"
				/>
			</drawer-detail>

			<drawer-detail icon="format_line_spacing" :title="$t('layouts.tabular.spacing')">
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
			</drawer-detail>
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
			:show-manual-sort="_filters && _filters.length === 0 && sortField !== null"
			:manual-sort-key="sortField && sortField.field"
			selection-use-keys
			@click:row="onRowClick"
			@update:sort="onSortChange"
			@manual-sort="changeManualSort"
		>
			<template v-for="header in tableHeaders" v-slot:[`item.${header.value}`]="{ item }">
				<span :key="header.value" v-if="!header.field.display">
					{{ item[header.value] }}
				</span>
				<render-display
					v-else
					:key="header.value"
					:value="item[header.value]"
					:display="header.field.display"
					:options="header.field.displayOptions"
					:interface="header.field.interface"
					:interface-options="header.field.interfaceOptions"
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
							:items="['25', '50', '100', '250']"
							inline
						/>
					</div>
				</div>
			</template>
		</v-table>

		<v-info v-else-if="itemCount === 0" :title="$t('no_results')" icon="search">
			{{ $t('no_results_copy') }}

			<template #append>
				<v-button @click="clearFilters">{{ $t('clear_filters') }}</v-button>
			</template>
		</v-info>

		<v-info v-else :title="$tc('item_count', 0)" :icon="info.icon">
			{{ $t('no_items_copy') }}

			<template #append>
				<v-button :to="newLink">{{ $t('add_new_item') }}</v-button>
			</template>
		</v-info>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { defineComponent, PropType, ref, computed, inject, toRefs } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import { HeaderRaw, Item } from '@/components/v-table/types';
import { Field } from '@/stores/fields/types';
import router from '@/router';
import useSync from '@/composables/use-sync';
import { debounce } from 'lodash';
import Draggable from 'vuedraggable';
import useCollection from '@/composables/use-collection';
import useItems from '@/composables/use-items';
import { render } from 'micromustache';
import { Filter } from '@/stores/collection-presets/types';
import i18n from '@/lang';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';

type ViewOptions = {
	widths?: {
		[field: string]: number;
	};
	limit?: number;
	spacing?: 'comfortable' | 'cozy' | 'compact';
};

type ViewQuery = {
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
		viewOptions: {
			type: Object as PropType<ViewOptions>,
			default: null,
		},
		viewQuery: {
			type: Object as PropType<ViewQuery>,
			default: null,
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
		detailRoute: {
			type: String,
			default: `/{{project}}/collections/{{collection}}/{{primaryKey}}`,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const { currentProjectKey } = toRefs(useProjectsStore().state);

		const table = ref<Vue>(null);
		const mainElement = inject('main-element', ref<Element>(null));

		const _selection = useSync(props, 'selection', emit);
		const _viewOptions = useSync(props, 'viewOptions', emit);
		const _viewQuery = useSync(props, 'viewQuery', emit);
		const _filters = useSync(props, 'filters', emit);
		const _searchQuery = useSync(props, 'searchQuery', emit);

		const { collection, searchQuery } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection, sortField } = useCollection(
			collection
		);

		const availableFields = computed(() =>
			fieldsInCollection.value.filter(({ hidden_browse }) => hidden_browse === false)
		);

		const { sort, limit, page, fields, fieldsWithRelational } = useItemOptions();

		const { items, loading, error, totalPages, itemCount, changeManualSort } = useItems(
			collection,
			{
				sort,
				limit,
				page,
				fields: fieldsWithRelational,
				filters: _filters,
				searchQuery,
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

		const newLink = computed(() => {
			return render(props.detailRoute, {
				project: currentProjectKey.value,
				collection: collection.value,
				primaryKey: '+',
				item: null,
			});
		});

		const showingCount = computed(() => {
			return i18n.t('start_end_of_count_items', {
				start: i18n.n((+page.value - 1) * limit.value + 1),
				end: i18n.n(Math.min(page.value * limit.value, itemCount.value || 0)),
				count: i18n.n(itemCount.value || 0),
			});
		});

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
			availableFields,
			fields,
			limit,
			activeFields,
			tableSpacing,
			primaryKeyField,
			_filters,
			info,
			newLink,
			clearFilters,
			showingCount,
			sortField,
			changeManualSort,
		};

		function clearFilters() {
			_filters.value = [];
			_searchQuery.value = null;
		}

		function toPage(newPage: number) {
			page.value = newPage;
			mainElement.value?.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}

		function useItemOptions() {
			const page = ref(1);

			const sort = computed({
				get() {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					return _viewQuery.value?.sort || primaryKeyField.value!.field;
				},
				set(newSort: string) {
					page.value = 1;
					_viewQuery.value = {
						..._viewQuery.value,
						sort: newSort,
					};
				},
			});

			const limit = computed({
				get() {
					return _viewOptions.value?.limit || 25;
				},
				set(newLimit: number) {
					page.value = 1;
					_viewOptions.value = {
						..._viewOptions.value,
						limit: newLimit,
					};
				},
			});

			const fields = computed({
				get() {
					if (_viewQuery.value?.fields) {
						// This shouldn't be the case, but double check just in case it's stored
						// differently in the DB from previous versions
						if (typeof _viewQuery.value.fields === 'string') {
							return (_viewQuery.value.fields as string).split(',');
						}
					}

					const fields =
						_viewQuery.value?.fields ||
						availableFields.value.slice(0, 4).map(({ field }) => field);

					return fields;
				},
				set(newFields: string[]) {
					_viewQuery.value = {
						..._viewQuery.value,
						fields: newFields,
					};
				},
			});

			const fieldsWithRelational = computed(() =>
				adjustFieldsForDisplays(fields.value, props.collection)
			);

			return { sort, limit, page, fields, fieldsWithRelational };
		}

		function useTable() {
			const tableSort = computed(() => {
				if (sort.value.startsWith('-')) {
					return { by: sort.value.substring(1), desc: true };
				} else {
					return { by: sort.value, desc: false };
				}
			});

			const localWidths = ref<{ [field: string]: number }>({});

			const saveWidthsToViewOptions = debounce(() => {
				_viewOptions.value = {
					..._viewOptions.value,
					widths: localWidths.value,
				};
			}, 350);

			const activeFields = computed<Field[]>({
				get() {
					return fields.value
						.map((key) => availableFields.value.find((field) => field.field === key))
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
						width:
							localWidths.value[field.field] ||
							_viewOptions.value?.widths?.[field.field] ||
							null,
						field: {
							display: field.display,
							displayOptions: field.display_options,
							interface: field.interface,
							interfaceOptions: field.options,
						},
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

					saveWidthsToViewOptions();
				},
			});

			const tableSpacing = computed({
				get() {
					return _viewOptions.value?.spacing || 'cozy';
				},
				set(newSpacing: 'compact' | 'cozy' | 'comfortable') {
					_viewOptions.value = {
						..._viewOptions.value,
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
						value:
							_selection.value?.includes(item[primaryKeyField.value.field]) === false,
					});
				} else {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const primaryKey = item[primaryKeyField.value!.field];
					router.push(
						render(props.detailRoute, {
							project: currentProjectKey.value,
							collection: collection.value,
							primaryKey,
							item,
						})
					);
				}
			}

			function onSortChange(newSort: { by: string; desc: boolean }) {
				let sortString = newSort.by;
				if (newSort.desc === true) sortString = '-' + sortString;

				sort.value = sortString;
			}

			function getFieldDisplay(fieldKey: string) {
				const field = availableFields.value.find((field) => field.field === fieldKey);

				if (field === undefined) return null;
				if (!field.display) return null;

				return {
					display: field.display,
					options: field.display_options,
				};
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.layout-tabular {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: 0;
}

.v-table {
	--v-table-sticky-offset-top: var(--layout-offset-top);

	display: contents;
}

.footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32px 0;

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
	}
}

.v-info {
	margin: 20vh 0;
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
	margin-right: 8px;
	color: var(--foreground-subdued);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}
</style>
