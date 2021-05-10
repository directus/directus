<template>
	<div class="layout-tabular">
		<!-- <teleport to="#target-layout-options"> -->
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
			<draggable
				v-model="activeFields"
				item-key="field"
				handle=".drag-handle"
				:set-data="hideDragImage"
				:force-fallback="true"
			>
				<template #item="{ element }">
					<v-checkbox v-model="fields" :value="element.field" :label="element.name">
						<template #append>
							<div class="spacer" />
							<v-icon @click.stop name="drag_handle" class="drag-handle" />
						</template>
					</v-checkbox>
				</template>
			</draggable>

			<v-checkbox
				v-for="field in availableFields.filter((field) => fields.includes(field.field) === false)"
				v-model="fields"
				:key="field.field"
				:value="field.field"
				:label="field.name"
			/>
		</div>
		<!-- </teleport> -->

		<!-- <teleport to="#target-sidebar"> -->
		<filter-sidebar-detail v-model="internalFilters" :collection="collection" :loading="loading" />
		<!-- </teleport> -->

		<!-- <teleport to="#target-actions:prepend"> -->
		<transition name="fade">
			<span class="item-count" v-if="itemCount">
				{{ showingCount }}
			</span>
		</transition>
		<!-- </teleport> -->

		<v-table
			v-model="internalSelection"
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
			v-model:headers="tableHeaders"
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
			<template v-for="header in tableHeaders" :key="header.value" v-slot:[`item.${header.value}`]="{ item }">
				<render-display
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
							:model-value="page"
							@update:model-value="toPage"
						/>
					</div>

					<div v-if="loading === false && items.length >= 25" class="per-page">
						<span>{{ $t('per_page') }}</span>
						<v-select
							@update:model-value="limit = +$event"
							:model-value="`${limit}`"
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
import { defineComponent, PropType, ref, computed, inject, toRefs, Ref, watch, ComponentPublicInstance } from 'vue';

import { HeaderRaw, Item } from '@/components/v-table/types';
import { Field, Filter } from '@/types';
import { useRouter } from 'vue-router';
import useSync from '@/composables/use-sync';
import { debounce, clone } from 'lodash';
import Draggable from 'vuedraggable';
import useCollection from '@/composables/use-collection';
import useItems from '@/composables/use-items';
import { i18n } from '@/lang';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import hideDragImage from '@/utils/hide-drag-image';
import useShortcut from '@/composables/use-shortcut';
import { getDefaultDisplayForType } from '@/utils/get-default-display-for-type';

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
	emits: ['update:selection', 'update:layoutOptions', 'update:layoutQuery', 'update:filters', 'update:searchQuery'],
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
		const router = useRouter();

		const table = ref<ComponentPublicInstance>();
		const mainElement = inject('main-element', ref<Element | null>(null));

		const internalSelection = useSync(props, 'selection', emit);
		const internalLayoutOptions: Ref<any> = useSync(props, 'layoutOptions', emit);
		const internalLayoutQuery: Ref<any> = useSync(props, 'layoutQuery', emit);
		const internalFilters = useSync(props, 'filters', emit);
		const internalSearchQuery = useSync(props, 'searchQuery', emit);

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
				filters: internalFilters,
				searchQuery: internalSearchQuery,
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
					return i18n.global.t('one_filtered_item');
				}
				return i18n.global.t('start_end_of_count_filtered_items', {
					start: i18n.global.n((+page.value - 1) * limit.value + 1),
					end: i18n.global.n(Math.min(page.value * limit.value, itemCount.value || 0)),
					count: i18n.global.n(itemCount.value || 0),
				});
			}
			if (itemCount.value === 1) {
				return i18n.global.t('one_item');
			}
			return i18n.global.t('start_end_of_count_items', {
				start: i18n.global.n((+page.value - 1) * limit.value + 1),
				end: i18n.global.n(Math.min(page.value * limit.value, itemCount.value || 0)),
				count: i18n.global.n(itemCount.value || 0),
			});
		});

		const activeFilterCount = computed(() => {
			let count = internalFilters.value.filter((filter) => !filter.locked).length;

			if (searchQuery.value && searchQuery.value.length > 0) count++;

			return count;
		});

		const availableFields = computed(() => {
			return fieldsInCollection.value.filter((field: Field) => field.meta?.special?.includes('no-data') !== true);
		});

		useShortcut(
			'meta+a',
			() => {
				internalSelection.value = clone(items.value).map((item: any) => item[primaryKeyField.value.field]);
			},
			table
		);

		return {
			internalSelection,
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
			internalFilters,
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
					return internalLayoutQuery.value?.page || 1;
				},
				set(newPage: number) {
					internalLayoutQuery.value = {
						...(internalLayoutQuery.value || {}),
						page: newPage,
					};
				},
			});

			const sort = computed({
				get() {
					return internalLayoutQuery.value?.sort || primaryKeyField.value?.field;
				},
				set(newSort: string) {
					internalLayoutQuery.value = {
						...(internalLayoutQuery.value || {}),
						page: 1,
						sort: newSort,
					};
				},
			});

			const limit = computed({
				get() {
					return internalLayoutQuery.value?.limit || 25;
				},
				set(newLimit: number) {
					internalLayoutQuery.value = {
						...(internalLayoutQuery.value || {}),
						page: 1,
						limit: newLimit,
					};
				},
			});

			const fields = computed({
				get() {
					if (internalLayoutQuery.value?.fields) {
						// This shouldn't be the case, but double check just in case it's stored
						// differently in the DB from previous versions
						if (typeof internalLayoutQuery.value.fields === 'string') {
							return (internalLayoutQuery.value.fields as string).split(',');
						}

						if (Array.isArray(internalLayoutQuery.value.fields)) return internalLayoutQuery.value.fields;
					}

					const fields =
						internalLayoutQuery.value?.fields ||
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
					internalLayoutQuery.value = {
						...(internalLayoutQuery.value || {}),
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
				() => internalLayoutOptions.value,
				() => {
					localWidths.value = {};
				}
			);

			const saveWidthsTolayoutOptions = debounce(() => {
				internalLayoutOptions.value = {
					...(internalLayoutOptions.value || {}),
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
						width: localWidths.value[field.field] || internalLayoutOptions.value?.widths?.[field.field] || null,
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
					return internalLayoutOptions.value?.spacing || 'cozy';
				},
				set(newSpacing: 'compact' | 'cozy' | 'comfortable') {
					internalLayoutOptions.value = {
						...(internalLayoutOptions.value || {}),
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

				if (props.selectMode || internalSelection.value?.length > 0) {
					(table.value as any).onItemSelected({
						item,
						value: internalSelection.value?.includes(item[primaryKeyField.value.field]) === false,
					});
				} else {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const primaryKey = item[primaryKeyField.value!.field];

					// @TODO3 Why was there an emtpy function as callback?
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

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.reset-preset {
	margin-top: 24px;
}
</style>
