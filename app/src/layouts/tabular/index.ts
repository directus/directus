import { defineLayout } from '@/layouts/define';
import TabularLayout from './tabular.vue';
import TabularOptions from './options.vue';
import TabularSidebar from './sidebar.vue';
import TabularActions from './actions.vue';

import { useI18n } from 'vue-i18n';
import { ref, computed, inject, watch, toRefs, ComponentPublicInstance } from 'vue';

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

type LayoutOptions = {
	widths?: {
		[field: string]: number;
	};
	limit?: number;
	spacing?: 'comfortable' | 'cozy' | 'compact';
};

type LayoutQuery = {
	fields?: string[];
	sort?: string;
	page?: number;
	limit?: number;
};

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'tabular',
	name: '$t:layouts.tabular.tabular',
	icon: 'reorder',
	component: TabularLayout,
	slots: {
		options: TabularOptions,
		sidebar: TabularSidebar,
		actions: TabularActions,
	},
	setup(props) {
		const { t, n } = useI18n();

		const router = useRouter();

		const table = ref<ComponentPublicInstance>();
		const mainElement = inject('main-element', ref<Element | null>(null));

		const { collection, searchQuery, selection, layoutOptions, layoutQuery, filters } = toRefs(props);

		const { info, primaryKeyField, fields: fieldsInCollection, sortField } = useCollection(collection);

		const { sort, limit, page, fields, fieldsWithRelational } = useItemOptions();

		const { items, loading, error, totalPages, itemCount, totalCount, changeManualSort, getItems } = useItems(
			collection,
			{
				sort,
				limit,
				page,
				fields: fieldsWithRelational,
				filters: filters,
				searchQuery: searchQuery,
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
			let count = filters.value.filter((filter) => !filter.locked).length;

			if (searchQuery.value && searchQuery.value.length > 0) count++;

			return count;
		});

		const availableFields = computed(() => {
			return fieldsInCollection.value.filter((field: Field) => field.meta?.special?.includes('no-data') !== true);
		});

		useShortcut(
			'meta+a',
			() => {
				if (!primaryKeyField.value) return;
				const pk = primaryKeyField.value;
				selection.value = clone(items.value).map((item) => item[pk.field]);
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
					return layoutQuery.value?.page || 1;
				},
				set(newPage: number) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						page: newPage,
					};
				},
			});

			const sort = computed({
				get() {
					return layoutQuery.value?.sort || primaryKeyField.value?.field || '';
				},
				set(newSort: string) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						page: 1,
						sort: newSort,
					};
				},
			});

			const limit = computed({
				get() {
					return layoutQuery.value?.limit || 25;
				},
				set(newLimit: number) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						page: 1,
						limit: newLimit,
					};
				},
			});

			const fields = computed({
				get() {
					if (layoutQuery.value?.fields) {
						// This shouldn't be the case, but double check just in case it's stored
						// differently in the DB from previous versions
						if (typeof layoutQuery.value.fields === 'string') {
							return (layoutQuery.value.fields as string).split(',');
						}

						if (Array.isArray(layoutQuery.value.fields)) return layoutQuery.value.fields;
					}

					const fields =
						layoutQuery.value?.fields ||
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
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						fields: newFields,
					};
				},
			});

			const fieldsWithRelational = computed(() => {
				if (!props.collection) return [];
				return adjustFieldsForDisplays(fields.value, props.collection);
			});

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
				() => layoutOptions.value,
				() => {
					localWidths.value = {};
				}
			);

			const saveWidthsTolayoutOptions = debounce(() => {
				layoutOptions.value = {
					...(layoutOptions.value || {}),
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
						width: localWidths.value[field.field] || layoutOptions.value?.widths?.[field.field] || null,
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
					return layoutOptions.value?.spacing || 'cozy';
				},
				set(newSpacing: 'compact' | 'cozy' | 'comfortable') {
					layoutOptions.value = {
						...(layoutOptions.value || {}),
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
				if (props.readonly === true || !primaryKeyField.value) return;

				if (props.selectMode || selection.value?.length > 0) {
					(table.value as any).onItemSelected({
						item,
						value: selection.value?.includes(item[primaryKeyField.value.field]) === false,
					});
				} else {
					const primaryKey = item[primaryKeyField.value.field];

					router.push(`/collections/${collection.value}/${encodeURIComponent(primaryKey)}`);
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
