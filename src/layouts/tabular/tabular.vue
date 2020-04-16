<template>
	<div class="layout-tabular">
		<portal to="drawer">
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
					full-width
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

			<drawer-detail icon="format_list_numbered" :title="$t('layouts.tabular.per_page')">
				<v-select
					full-width
					@input="limit = +$event"
					:value="`${limit}`"
					:items="['10', '25', '50', '100', '250']"
				/>
			</drawer-detail>
		</portal>

		<v-table
			v-model="_selection"
			v-if="loading || itemCount > 0"
			ref="table"
			fixed-header
			:show-select="selection !== undefined"
			show-resize
			must-sort
			:sort="tableSort"
			:items="items"
			:loading="loading"
			:headers.sync="tableHeaders"
			:row-height="tableRowHeight"
			:server-sort="itemCount === limit || totalPages > 1"
			@click:row="onRowClick"
			@update:sort="onSortChange"
		>
			<template #footer>
				<div class="pagination" v-if="totalPages > 1">
					<v-pagination
						:length="totalPages"
						:total-visible="5"
						show-first-last
						:value="page"
						@input="toPage"
					/>
				</div>
			</template>
		</v-table>

		<v-info v-else :title="$tc('item_count', 0)" icon="box" />
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { defineComponent, PropType, ref, computed, inject, toRefs } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import { HeaderRaw, Item } from '@/components/v-table/types';
import { Field } from '@/stores/fields/types';
import router from '@/router';
import useSync from '@/compositions/use-sync';
import { debounce } from 'lodash';
import Draggable from 'vuedraggable';
import useCollection from '@/compositions/use-collection';
import useItems from '@/compositions/use-items';
import { render } from 'micromustache';
import { Filter } from '@/stores/collection-presets/types';

type ViewOptions = {
	widths?: {
		[field: string]: number;
	};
	limit?: number;
	spacing?: 'comfortable' | 'cozy' | 'compact';
};

export type ViewQuery = {
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
		selectMode: {
			type: Boolean,
			default: false,
		},
		detailRoute: {
			type: String,
			default: `/{{project}}/collections/{{collection}}/{{primaryKey}}`,
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

		const { collection } = toRefs(props);
		const { primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const availableFields = computed(() =>
			fieldsInCollection.value.filter(({ hidden_browse }) => hidden_browse === false)
		);

		const { sort, limit, page, fields } = useItemOptions();

		const { items, loading, error, totalPages, itemCount } = useItems(collection, {
			sort,
			limit,
			page,
			fields,
			filters: _filters,
		});

		const {
			tableSort,
			tableHeaders,
			tableRowHeight,
			onRowClick,
			onSortChange,
			activeFields,
			tableSpacing,
		} = useTable();

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
		};

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

					return (
						_viewQuery.value?.fields ||
						availableFields.value.slice(0, 4).map(({ field }) => field)
					);
				},
				set(newFields: string[]) {
					_viewQuery.value = {
						..._viewQuery.value,
						fields: newFields,
					};
				},
			});

			return { sort, limit, page, fields };
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
			};

			function onRowClick(item: Item) {
				if (props.selectMode || _selection.value?.length > 0) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(table.value as any).onItemSelected({
						item,
						value: _selection.value?.includes(item) === false,
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

.pagination {
	position: sticky;
	left: 0;
	width: 100%;
	padding: 32px;
	text-align: center;
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
</style>
