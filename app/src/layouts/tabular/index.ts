import { defineLayout } from '@/layouts/define';
import TabularLayout from './tabular.vue';
import Options from './options.vue';
import Sidebar from './sidebar.vue';
import Actions from './actions.vue';

import { useI18n } from 'vue-i18n';
import { ref, computed, inject, watch, ComponentPublicInstance } from 'vue';

import { HeaderRaw, Item } from '@/components/v-table/types';
import { Field } from '@/types';
import { useRouter } from 'vue-router';
import { debounce, clone } from 'lodash';
import useCollection from '@/composables/use-collection';
import useItems from '@/composables/use-items';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import hideDragImage from '@/utils/hide-drag-image';
import useShortcut from '@/composables/use-shortcut';
import { getDefaultDisplayForType } from '@/utils/get-default-display-for-type';

export default defineLayout({
	id: 'tabular',
	name: '$t:layouts.tabular.tabular',
	icon: 'reorder',
	component: TabularLayout,
	slots: {
		options: Options,
		sidebar: Sidebar,
		actions: Actions,
	},
	setup(props) {
		const { t, n } = useI18n();

		const router = useRouter();

		const table = ref<ComponentPublicInstance>();
		const mainElement = inject('main-element', ref<Element | null>(null));

		const { info, primaryKeyField, fields: fieldsInCollection, sortField } = useCollection(props.collection);

		const { sort, limit, page, fields, fieldsWithRelational } = useItemOptions();

		const { items, loading, error, totalPages, itemCount, totalCount, changeManualSort, getItems } = useItems(
			props.collection,
			{
				sort,
				limit,
				page,
				fields: fieldsWithRelational,
				filters: props.filters,
				searchQuery: props.searchQuery,
			}
		);

		const { tableSort, tableHeaders, tableRowHeight, onRowClick, onSortChange, activeFields, tableSpacing } =
			useTable();

		const showingCount = computed(() => {
			if ((itemCount.value || 0) < (totalCount.value || 0)) {
				if (itemCount.value === 1) {
					return t('one_filtered_item');
				}
				return t('start_end_of_count_filtered_items', {
					start: n((+page.value - 1) * limit.value + 1),
					end: n(Math.min(page.value * limit.value, itemCount.value || 0)),
					count: n(itemCount.value || 0),
				});
			}
			if (itemCount.value === 1) {
				return t('one_item');
			}
			return t('start_end_of_count_items', {
				start: n((+page.value - 1) * limit.value + 1),
				end: n(Math.min(page.value * limit.value, itemCount.value || 0)),
				count: n(itemCount.value || 0),
			});
		});

		const activeFilterCount = computed(() => {
			let count = props.filters.value.filter((filter) => !filter.locked).length;

			if (props.searchQuery.value && props.searchQuery.value.length > 0) count++;

			return count;
		});

		const availableFields = computed(() => {
			return fieldsInCollection.value.filter((field: Field) => field.meta?.special?.includes('no-data') !== true);
		});

		useShortcut(
			'meta+a',
			() => {
				props.selection.value = clone(items.value).map((item: any) => item[primaryKeyField.value.field]);
			},
			table
		);

		return {
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
			await props.resetPreset.value();
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
					return props.layoutQuery.value?.page || 1;
				},
				set(newPage: number) {
					props.layoutQuery.value = {
						...(props.layoutQuery.value || {}),
						page: newPage,
					};
				},
			});

			const sort = computed({
				get() {
					return props.layoutQuery.value?.sort || primaryKeyField.value?.field;
				},
				set(newSort: string) {
					props.layoutQuery.value = {
						...(props.layoutQuery.value || {}),
						page: 1,
						sort: newSort,
					};
				},
			});

			const limit = computed({
				get() {
					return props.layoutQuery.value?.limit || 25;
				},
				set(newLimit: number) {
					props.layoutQuery.value = {
						...(props.layoutQuery.value || {}),
						page: 1,
						limit: newLimit,
					};
				},
			});

			const fields = computed({
				get() {
					if (props.layoutQuery.value?.fields) {
						// This shouldn't be the case, but double check just in case it's stored
						// differently in the DB from previous versions
						if (typeof props.layoutQuery.value.fields === 'string') {
							return (props.layoutQuery.value.fields as string).split(',');
						}

						if (Array.isArray(props.layoutQuery.value.fields)) return props.layoutQuery.value.fields;
					}

					const fields =
						props.layoutQuery.value?.fields ||
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
					props.layoutQuery.value = {
						...(props.layoutQuery.value || {}),
						fields: newFields,
					};
				},
			});

			const fieldsWithRelational = computed(() => adjustFieldsForDisplays(fields.value, props.collection.value));

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
				() => props.layoutOptions.value,
				() => {
					localWidths.value = {};
				}
			);

			const saveWidthsTolayoutOptions = debounce(() => {
				props.layoutOptions.value = {
					...(props.layoutOptions.value || {}),
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
						width: localWidths.value[field.field] || props.layoutOptions.value?.widths?.[field.field] || null,
						field: {
							display: field.meta?.display || getDefaultDisplayForType(field.type),
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
					return props.layoutOptions.value?.spacing || 'cozy';
				},
				set(newSpacing: 'compact' | 'cozy' | 'comfortable') {
					props.layoutOptions.value = {
						...(props.layoutOptions.value || {}),
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
				if (props.readonly.value === true) return;

				if (props.selectMode.value || props.selection.value?.length > 0) {
					(table.value as any).onItemSelected({
						item,
						value: props.selection.value?.includes(item[primaryKeyField.value.field]) === false,
					});
				} else {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const primaryKey = item[primaryKeyField.value!.field];

					// @TODO3 Why was there an emtpy function as callback?
					router.push(`/collections/${props.collection.value}/${encodeURIComponent(primaryKey)}`);
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
