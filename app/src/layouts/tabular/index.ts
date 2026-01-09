import { useCollection, useItems, useSync } from '@directus/composables';
import { defineLayout } from '@directus/extensions';
import { Field } from '@directus/types';
import { debounce, flatten } from 'lodash';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TabularActions from './actions.vue';
import TabularOptions from './options.vue';
import TabularLayout from './tabular.vue';
import { LayoutOptions, LayoutQuery } from './types';
import { useAiStore } from '@/ai/stores/use-ai';
import { HeaderRaw, Sort } from '@/components/v-table/types';
import { useAliasFields } from '@/composables/use-alias-fields';
import { useLayoutClickHandler } from '@/composables/use-layout-click-handler';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { formatItemsCountPaginated } from '@/utils/format-items-count';
import { getDefaultDisplayForType } from '@/utils/get-default-display-for-type';
import { hideDragImage } from '@/utils/hide-drag-image';
import { saveAsCSV } from '@/utils/save-as-csv';
import { syncRefProperty } from '@/utils/sync-ref-property';

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'tabular',
	name: '$t:layouts.tabular.tabular',
	icon: 'table_rows',
	component: TabularLayout,
	slots: {
		options: TabularOptions,
		sidebar: () => undefined,
		actions: TabularActions,
	},
	headerShadow: false,
	setup(props, { emit }) {
		const { t, n } = useI18n();
		const fieldsStore = useFieldsStore();

		const aiStore = useAiStore();

		aiStore.onSystemToolResult((tool, input) => {
			if (tool === 'items' && input.collection === collection.value) {
				refresh();
			}
		});

		const selection = useSync(props, 'selection', emit);
		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const layoutQuery = useSync(props, 'layoutQuery', emit);

		const { collection, filter, filterSystem, filterUser, search } = toRefs(props);

		const { info, primaryKeyField, fields: fieldsInCollection, sortField } = useCollection(collection);

		const { sort, limit, page, fields } = useItemOptions();

		const { aliasedFields, aliasQuery, aliasedKeys } = useAliasFields(fields, collection);

		const fieldsWithRelationalAliased = computed(() =>
			flatten(Object.values(aliasedFields.value).map(({ fields }) => fields)),
		);

		const {
			items,
			loading,
			loadingItemCount,
			error,
			totalPages,
			itemCount,
			totalCount,
			changeManualSort,
			getItems,
			getItemCount,
			getTotalCount,
		} = useItems(collection, {
			sort,
			limit,
			page,
			fields: fieldsWithRelationalAliased,
			alias: aliasQuery,
			filter,
			search,
			filterSystem,
		});

		const { onClick } = useLayoutClickHandler({ props, items, selection, primaryKeyField });

		const { tableSort, tableHeaders, tableRowHeight, onSortChange, onAlignChange, activeFields, tableSpacing } =
			useTable();

		const showingCount = computed(() => {
			// Don't show count if there are no items
			if (!totalCount.value || !itemCount.value) return;

			return formatItemsCountPaginated({
				currentItems: itemCount.value,
				currentPage: page.value,
				perPage: limit.value,
				isFiltered: !!filterUser.value,
				totalItems: totalCount.value,
				i18n: { t, n },
			});
		});

		return {
			tableHeaders,
			items,
			loading,
			loadingItemCount,
			error,
			totalPages,
			tableSort,
			onRowClick: onClick,
			onSortChange,
			onAlignChange,
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
			refresh,
			resetPresetAndRefresh,
			selectAll,
			filter,
			search,
			download,
			fieldsWithRelationalAliased,
			aliasedFields,
			aliasedKeys,
		};

		async function resetPresetAndRefresh() {
			await props?.resetPreset?.();
			refresh();
		}

		function refresh() {
			getItems();
			getTotalCount();
			getItemCount();
		}

		function download() {
			if (!collection.value) return;
			saveAsCSV(collection.value, fields.value, items.value);
		}

		function toPage(newPage: number) {
			page.value = newPage;
		}

		function selectAll() {
			if (!primaryKeyField.value) return;
			const pk = primaryKeyField.value;
			selection.value = items.value.map((item) => item[pk.field]);
		}

		function useItemOptions() {
			const page = syncRefProperty(layoutQuery, 'page', 1);
			const limit = syncRefProperty(layoutQuery, 'limit', 25);

			const defaultSort = computed(() => {
				const field = sortField.value ?? primaryKeyField.value?.field;
				return field ? [field] : [];
			});

			const sort = syncRefProperty(layoutQuery, 'sort', defaultSort);

			const fieldsDefaultValue = computed(() => {
				return fieldsInCollection.value
					.filter((field) => !field.meta?.hidden && !field.meta?.special?.includes('no-data'))
					.slice(0, 4)
					.map(({ field }) => field)
					.sort();
			});

			const fields = computed({
				get() {
					if (layoutQuery.value?.fields) {
						return layoutQuery.value.fields.filter((field) => fieldsStore.getField(collection.value!, field));
					} else {
						return unref(fieldsDefaultValue);
					}
				},
				set(value) {
					layoutQuery.value = Object.assign({}, layoutQuery.value, { fields: value });
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
				if (!sort.value?.[0]) {
					return null;
				} else if (sort.value?.[0].startsWith('-')) {
					return { by: sort.value[0].substring(1), desc: true };
				} else {
					return { by: sort.value[0], desc: false };
				}
			});

			const localWidths = ref<{ [field: string]: number }>({});

			watch(
				() => layoutOptions.value,
				() => {
					localWidths.value = {};
				},
			);

			const saveWidthsToLayoutOptions = debounce(() => {
				layoutOptions.value = Object.assign({}, layoutOptions.value, {
					widths: localWidths.value,
				});
			}, 350);

			const activeFields = computed<(Field & { key: string })[]>({
				get() {
					if (!collection.value) return [];

					return fields.value
						.map((key) => ({ ...fieldsStore.getField(collection.value!, key), key }))
						.filter((f) => f && f.meta?.special?.includes('no-data') !== true) as (Field & { key: string })[];
				},
				set(val) {
					fields.value = val.map((field) => field.field);
				},
			});

			const tableHeaders = computed<HeaderRaw[]>({
				get() {
					return activeFields.value.map((field) => {
						let description: string | null = null;

						const fieldParts = field.key.split('.');

						if (fieldParts.length > 1) {
							const fieldNames = fieldParts.map((fieldKey, index) => {
								const pathPrefix = fieldParts.slice(0, index);
								const field = fieldsStore.getField(collection.value!, [...pathPrefix, fieldKey].join('.'));
								return field?.name ?? fieldKey;
							});

							description = fieldNames.join(' -> ');
						}

						const width = localWidths.value[field.key] || layoutOptions.value?.widths?.[field.key] || 160;

						return {
							text: field.name,
							value: field.key,
							description,
							width,
							align: layoutOptions.value?.align?.[field.key] || 'left',
							field: {
								display: field.meta?.display || getDefaultDisplayForType(field.type),
								displayOptions: field.meta?.display_options,
								interface: field.meta?.interface,
								interfaceOptions: field.meta?.options,
								type: field.type,
								field: field.field,
								collection: field.collection,
							},
							sortable: ['json', 'alias', 'presentation', 'translations'].includes(field.type) === false,
						} as HeaderRaw;
					});
				},
				set(val) {
					const widths = {} as { [field: string]: number };

					val.forEach((header) => {
						widths[header.value] = header.width ?? 160;
					});

					localWidths.value = widths;

					saveWidthsToLayoutOptions();

					fields.value = val.map((header) => header.value);
				},
			});

			const tableSpacing = syncRefProperty(layoutOptions, 'spacing', 'cozy');

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
				onSortChange,
				onAlignChange,
				activeFields,
				getFieldDisplay,
			};

			function onSortChange(newSort: Sort | null) {
				if (!newSort?.by) {
					sort.value = [];
					return;
				}

				let sortString = newSort.by;

				if (newSort.desc === true) {
					sortString = '-' + sortString;
				}

				sort.value = [sortString];
			}

			function onAlignChange(field: string, align: 'left' | 'center' | 'right') {
				layoutOptions.value = Object.assign({}, layoutOptions.value, {
					align: {
						...(layoutOptions.value?.align ?? {}),
						[field]: align,
					},
				});
			}

			function getFieldDisplay(fieldKey: string) {
				const field = fieldsInCollection.value.find((field: Field) => field.field === fieldKey);

				if (!field?.meta?.display) return null;

				return {
					display: field.meta.display,
					options: field.meta.display_options,
				};
			}
		}
	},
});
