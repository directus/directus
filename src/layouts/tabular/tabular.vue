<template>
	<div class="layout-tabular">
		<portal to="drawer">
			<drawer-detail icon="table_chart" :title="$t('layouts.tabular.fields')">
				<draggable v-model="activeFields">
					<v-checkbox
						v-for="field in activeFields"
						v-model="activeFieldKeys"
						:key="field.field"
						:value="field.field"
						:label="field.name"
					/>
				</draggable>

				<v-checkbox
					v-for="field in visibleFields.filter(
						(field) => activeFieldKeys.includes(field.field) === false
					)"
					v-model="activeFieldKeys"
					:key="field.field"
					:value="field.field"
					:label="field.name"
				/>
			</drawer-detail>

			<drawer-detail icon="line_weight" :title="$t('layouts.tabular.spacing')">
				<select v-model="spacing">
					<option value="compact">{{ $t('layouts.tabular.compact') }}</option>
					<option value="cozy">{{ $t('layouts.tabular.cozy') }}</option>
					<option value="comfortable">{{ $t('layouts.tabular.comfortable') }}</option>
				</select>
			</drawer-detail>

			<drawer-detail icon="format_list_numbered" :title="$t('layouts.tabular.per_page')">
				<select v-model="perPage">
					<option v-for="amount in [10, 25, 50, 100, 250]" :key="amount" :value="amount">
						{{ amount }}
					</option>
				</select>
			</drawer-detail>
		</portal>

		<v-table
			v-model="_selection"
			ref="table"
			fixed-header
			show-select
			show-resize
			must-sort
			:sort="tableSort"
			:items="items"
			:loading="loading"
			:headers.sync="headers"
			:row-height="rowHeight"
			:server-sort="isBigCollection"
			@click:row="onRowClick"
			@update:sort="onSortChange"
		>
			<template #footer>
				<div class="pagination" v-if="isBigCollection">
					<v-pagination
						:length="pages"
						:total-visible="5"
						show-first-last
						:value="currentPage"
						@input="toPage"
					/>
				</div>
			</template>
		</v-table>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { defineComponent, PropType, ref, watch, computed, inject } from '@vue/composition-api';
import api from '@/api';
import useProjectsStore from '@/stores/projects';
import useFieldsStore from '@/stores/fields';
import { HeaderRaw, Item } from '@/components/v-table/types';
import { Field } from '@/stores/fields/types';
import router from '@/router';
import useSync from '@/compositions/use-sync';
import { debounce } from 'lodash';
import Draggable from 'vuedraggable';

type ViewOptions = {
	widths?: {
		[field: string]: number;
	};
	perPage?: number;
	spacing?: 'comfortable' | 'cozy' | 'compact';
};

export type ViewQuery = {
	fields?: string;
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
			default: () => [],
		},
		selectMode: {
			type: Boolean,
			default: false,
		},
		viewOptions: {
			type: Object as PropType<ViewOptions>,
			default: null,
		},
		viewQuery: {
			type: Object as PropType<ViewQuery>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const table = ref<Vue>(null);
		const mainElement = inject('main-element', ref<Element>(null));

		const projectsStore = useProjectsStore();
		const fieldsStore = useFieldsStore();
		const { currentProjectKey } = projectsStore.state;

		const _selection = useSync(props, 'selection', emit);
		const _viewOptions = useSync(props, 'viewOptions', emit);
		const _viewQuery = useSync(props, 'viewQuery', emit);

		const { visibleFields, primaryKeyField } = useCollectionInfo();

		const {
			isBigCollection,
			pages,
			getItems,
			error,
			items,
			loading,
			itemCount,
			currentPage,
			toPage,
			sort,
			perPage,
			activeFieldKeys,
			activeFields,
		} = useItems();

		const { headers, rowHeight, spacing, onRowClick, tableSort, onSortChange } = useTable();

		getItems();

		return {
			error,
			items,
			loading,
			headers,
			onRowClick,
			primaryKeyField,
			_selection,
			refresh,
			table,
			itemCount,
			pages,
			toPage,
			currentPage,
			isBigCollection,
			onSortChange,
			rowHeight,
			_viewOptions,
			spacing,
			tableSort,
			perPage,
			visibleFields,
			activeFieldKeys,
			activeFields,
		};

		async function refresh() {
			await getItems();
		}

		function useTable() {
			const localWidths = ref<{ [field: string]: number }>({});

			const saveWidthsToViewOptions = debounce(() => {
				_viewOptions.value = {
					..._viewOptions.value,
					widths: localWidths.value,
				};
			}, 350);

			const headers = computed<HeaderRaw[]>({
				get() {
					return activeFields.value.map((field) => ({
						text: field.name,
						value: field.field,
						width:
							localWidths.value[field.field] ||
							_viewOptions.value.widths?.[field.field] ||
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

			const rowHeight = computed<number>(() => {
				const spacing = props.viewOptions?.spacing || 'comfortable';

				switch (spacing) {
					case 'compact':
						return 32;
					case 'cozy':
					default:
						return 48;
					case 'comfortable':
						return 64;
				}
			});

			const spacing = computed({
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

			const tableSort = computed(() => {
				if (sort.value.startsWith('-')) {
					return { by: sort.value.substring(1), desc: true };
				} else {
					return { by: sort.value, desc: false };
				}
			});

			return {
				headers,
				rowHeight,
				spacing,
				onRowClick,
				onSortChange,
				tableSort,
			};

			function onRowClick(item: Item) {
				if (props.selectMode) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(table.value as any).onItemSelected({
						item,
						value: _selection.value.includes(item) === false,
					});
				} else {
					const primaryKey = item[primaryKeyField.value.field];
					router.push(
						`/${currentProjectKey}/collections/${props.collection}/${primaryKey}`
					);
				}
			}

			function onSortChange(newSort: { by: string; desc: boolean }) {
				let sortString = newSort.by;
				if (newSort.desc === true) sortString = '-' + sortString;

				sort.value = sortString;
			}
		}

		function useCollectionInfo() {
			const fieldsInCurrentCollection = computed<Field[]>(() => {
				return fieldsStore.state.fields.filter(
					(field) => field.collection === props.collection
				);
			});

			const visibleFields = computed<Field[]>(() => {
				return fieldsInCurrentCollection.value.filter(
					(field) => field.hidden_browse === false
				);
			});

			const primaryKeyField = computed<Field>(() => {
				// It's safe to assume that every collection has a primary key.
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				return fieldsInCurrentCollection.value.find((field) => field.primary_key === true)!;
			});

			return { fieldsInCurrentCollection, visibleFields, primaryKeyField };
		}

		function useItems() {
			const error = ref(null);
			const items = ref([]);
			const loading = ref(true);
			const itemCount = ref<number>(null);
			const currentPage = ref(1);
			const perPage = computed<number>({
				get() {
					return props.viewOptions?.perPage || 25;
				},
				set(val) {
					_viewOptions.value = {
						..._viewOptions.value,
						perPage: val,
					};

					currentPage.value = 1;

					Vue.nextTick().then(() => {
						getItems();
					});
				},
			});
			const pages = computed<number>(() => Math.ceil(itemCount.value || 0 / perPage.value));
			const isBigCollection = computed<boolean>(() => (itemCount.value || 0) > perPage.value);

			const sort = computed<string>({
				get() {
					return _viewQuery.value?.sort || primaryKeyField.value.field;
				},
				set(newSort) {
					_viewQuery.value = {
						..._viewQuery.value,
						sort: newSort,
					};

					// Let the table component handle the sorting for small datasets
					if (isBigCollection.value === false) return;

					currentPage.value = 1;

					Vue.nextTick().then(() => {
						getItems();
					});
				},
			});

			const activeFieldKeys = computed<string[]>({
				get() {
					return (
						_viewQuery.value?.fields?.split(',') ||
						visibleFields.value.map((field) => field.field)
					);
				},
				set(newFields: string[]) {
					_viewQuery.value = {
						..._viewQuery.value,
						fields: newFields.join(','),
					};

					Vue.nextTick().then(() => {
						getItems();
					});
				},
			});

			const activeFields = computed<Field[]>({
				get() {
					return activeFieldKeys.value
						.map((key) => visibleFields.value.find((field) => field.field === key))
						.filter((f) => f) as Field[];
				},
				set(val) {
					activeFieldKeys.value = val.map((field) => field.field);
				},
			});

			watch(
				() => props.collection,
				() => {
					items.value = [];
					itemCount.value = null;
					currentPage.value = 1;
					getItems();
				}
			);

			return {
				isBigCollection,
				pages,
				getItems,
				getTotalCount,
				error,
				items,
				loading,
				itemCount,
				sort,
				toPage,
				currentPage,
				perPage,
				activeFieldKeys,
				activeFields,
			};

			async function getTotalCount() {
				const response = await api.get(`/${currentProjectKey}/items/${props.collection}`, {
					params: {
						limit: 0,
						fields: primaryKeyField.value.field,
						meta: 'filter_count',
					},
				});

				itemCount.value = response.data.meta.filter_count;
			}

			async function getItems() {
				error.value = null;
				loading.value = true;

				const fieldsToFetch = [...activeFieldKeys.value];

				if (fieldsToFetch.includes(primaryKeyField.value.field) === false) {
					fieldsToFetch.push(primaryKeyField.value.field);
				}

				try {
					const response = await api.get(
						`/${currentProjectKey}/items/${props.collection}`,
						{
							params: {
								fields: fieldsToFetch,
								limit: perPage.value,
								page: currentPage.value,
								sort: sort.value,
							},
						}
					);

					items.value = response.data.data;

					if (itemCount.value === null) {
						if (response.data.data.length === perPage.value) {
							// Requesting the page filter count in the actual request every time slows
							// the request down by like 600ms-1s. This makes sure we only fetch the count
							// once if needed.
							getTotalCount();
						} else {
							// If the response includes less items than the limit, it's safe to assume
							// it's all the data in the DB
							itemCount.value = response.data.data.length;
						}
					}
				} catch (error) {
					error.value = error;
				} finally {
					loading.value = false;
				}
			}

			function toPage(page: number) {
				currentPage.value = page;
				getItems();
				mainElement.value?.scrollTo({
					top: 0,
					behavior: 'smooth',
				});
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.layout-tabular {
	display: contents;
}

.v-table {
	--v-table-sticky-offset-top: var(--layout-offset-top);

	display: contents;
	padding: 0 32px;
}

.pagination {
	position: sticky;
	left: 0;
	width: 100%;
	padding: 32px;
	text-align: center;
}
</style>
