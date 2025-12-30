<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VFieldList from '@/components/v-field-list/v-field-list.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VPagination from '@/components/v-pagination.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { HeaderRaw } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import { AliasFields, useAliasFields } from '@/composables/use-alias-fields';
import { usePageSize } from '@/composables/use-page-size';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { useShortcut } from '@/composables/use-shortcut';
import { Collection } from '@/types/collections';
import RenderDisplay from '@/views/private/components/render-display.vue';
import { useSync } from '@directus/composables';
import type { Field, Filter, Item, ShowSelect } from '@directus/types';
import { ComponentPublicInstance, inject, ref, Ref, toRefs, watch } from 'vue';

defineOptions({ inheritAttrs: false });

interface Props {
	collection: string;
	selection?: Item[];
	readonly: boolean;
	tableHeaders: HeaderRaw[];
	showSelect?: ShowSelect;
	items: Item[];
	loading: boolean;
	loadingItemCount: boolean;
	error?: any;
	totalPages: number;
	tableSort?: { by: string; desc: boolean } | null;
	onRowClick: ({ item, event }: { item: Item; event: PointerEvent }) => void;
	tableRowHeight: number;
	page: number;
	toPage: (newPage: number) => void;
	itemCount?: number;
	fields: string[];
	limit: number;
	primaryKeyField?: Field;
	info?: Collection;
	sortField?: string;
	changeManualSort: (data: any) => Promise<void>;
	resetPresetAndRefresh: () => Promise<void>;
	selectAll: () => void;
	filterUser?: Filter;
	search?: string;
	aliasedFields: Record<string, AliasFields>;
	aliasedKeys: string[];
	onSortChange: (newSort: { by: string; desc: boolean }) => void;
	onAlignChange?: (field: 'string', align: 'left' | 'center' | 'right') => void;
}

const props = withDefaults(defineProps<Props>(), {
	selection: () => [],
	showSelect: 'none',
	error: null,
	itemCount: undefined,
	tableSort: undefined,
	primaryKeyField: undefined,
	info: undefined,
	sortField: undefined,
	filterUser: undefined,
	search: undefined,
	onAlignChange: () => undefined,
});

const emit = defineEmits(['update:selection', 'update:tableHeaders', 'update:limit', 'update:fields']);

const { collection } = toRefs(props);

const { sortAllowed } = useCollectionPermissions(collection);

const selectionWritable = useSync(props, 'selection', emit);
const tableHeadersWritable = useSync(props, 'tableHeaders', emit);
const limitWritable = useSync(props, 'limit', emit);

const mainElement = inject<Ref<Element | undefined>>('main-element');

const table = ref<ComponentPublicInstance>();

watch(
	() => props.page,
	() => mainElement?.value?.scrollTo({ top: 0, behavior: 'smooth' }),
);

useShortcut(
	'meta+a',
	() => {
		props.selectAll();
	},
	table,
);

const { sizes: pageSizes, selected: selectedSize } = usePageSize<string>(
	[25, 50, 100, 250, 500, 1000],
	(value) => String(value),
	props.limit,
);

if (limitWritable.value !== selectedSize) {
	limitWritable.value = selectedSize;
}

const fieldsWritable = useSync(props, 'fields', emit);

const { getFromAliasedItem } = useAliasFields(fieldsWritable, collection);

function addField(fieldKey: string) {
	fieldsWritable.value = [...fieldsWritable.value, fieldKey];
}

function removeField(fieldKey: string) {
	fieldsWritable.value = fieldsWritable.value.filter((field) => field !== fieldKey);
}
</script>

<template>
	<div class="layout-tabular">
		<VTable
			v-if="loading || (items.length > 0 && !error)"
			ref="table"
			v-model="selectionWritable"
			v-model:headers="tableHeadersWritable"
			class="table"
			fixed-header
			:show-select="showSelect ? showSelect : selection !== undefined"
			show-resize
			must-sort
			:sort="tableSort"
			:items="items"
			:loading="loading"
			:row-height="tableRowHeight"
			:item-key="primaryKeyField?.field"
			:show-manual-sort="sortAllowed"
			:manual-sort-key="sortField"
			allow-header-reorder
			selection-use-keys
			@click:row="onRowClick"
			@update:sort="onSortChange"
			@manual-sort="changeManualSort"
		>
			<template v-for="header in tableHeaders" :key="header.value" #[`item.${header.value}`]="{ item }">
				<RenderDisplay
					:value="getFromAliasedItem(item, header.value)"
					:display="header.field.display"
					:options="header.field.displayOptions"
					:interface="header.field.interface"
					:interface-options="header.field.interfaceOptions"
					:type="header.field.type"
					:collection="header.field.collection"
					:field="header.field.field"
				/>
			</template>

			<template #header-context-menu="{ header }">
				<VList>
					<VListItem
						:disabled="!header.sortable"
						:active="tableSort?.by === header.value && tableSort?.desc === false"
						clickable
						@click="onSortChange({ by: header.value, desc: false })"
					>
						<VListItemIcon>
							<VIcon name="sort" class="flip" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('sort_asc') }}
						</VListItemContent>
					</VListItem>

					<VListItem
						:active="tableSort?.by === header.value && tableSort?.desc === true"
						:disabled="!header.sortable"
						clickable
						@click="onSortChange({ by: header.value, desc: true })"
					>
						<VListItemIcon>
							<VIcon name="sort" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('sort_desc') }}
						</VListItemContent>
					</VListItem>

					<VDivider />

					<VListItem :active="header.align === 'left'" clickable @click="onAlignChange?.(header.value, 'left')">
						<VListItemIcon>
							<VIcon name="format_align_left" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('left_align') }}
						</VListItemContent>
					</VListItem>
					<VListItem :active="header.align === 'center'" clickable @click="onAlignChange?.(header.value, 'center')">
						<VListItemIcon>
							<VIcon name="format_align_center" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('center_align') }}
						</VListItemContent>
					</VListItem>
					<VListItem :active="header.align === 'right'" clickable @click="onAlignChange?.(header.value, 'right')">
						<VListItemIcon>
							<VIcon name="format_align_right" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('right_align') }}
						</VListItemContent>
					</VListItem>

					<VDivider />

					<VListItem :active="header.align === 'right'" clickable @click="removeField(header.value)">
						<VListItemIcon>
							<VIcon name="remove" />
						</VListItemIcon>
						<VListItemContent>
							{{ $t('hide_field') }}
						</VListItemContent>
					</VListItem>
				</VList>
			</template>

			<template #header-append>
				<VMenu placement="bottom-end" show-arrow :close-on-content-click="false">
					<template #activator="{ toggle, active }">
						<VIcon
							v-tooltip="$t('add_field')"
							class="add-field"
							name="add"
							:class="{ active }"
							clickable
							@click="toggle"
						/>
					</template>

					<VFieldList
						:collection="collection"
						:disabled-fields="fields"
						:allow-select-all="false"
						@add="addField($event[0])"
					/>
				</VMenu>
			</template>

			<template #footer>
				<div class="footer">
					<div class="pagination">
						<VSkeletonLoader v-if="!loading && loadingItemCount && items.length === limit" type="pagination" />
						<VPagination
							v-else-if="totalPages > 1"
							:length="totalPages"
							:total-visible="7"
							show-first-last
							:model-value="page"
							@update:model-value="toPage"
						/>
					</div>

					<div v-if="loading === false && (items.length >= 25 || limit < 25)" class="per-page">
						<span>{{ $t('per_page') }}</span>
						<VSelect
							:model-value="`${limit}`"
							:items="pageSizes"
							inline
							@update:model-value="limitWritable = +$event"
						/>
					</div>
				</div>
			</template>
		</VTable>

		<slot v-else-if="error" name="error" :error="error" :reset="resetPresetAndRefresh" />
		<slot v-else-if="itemCount === 0 && (filterUser || search)" name="no-results" />
		<slot v-else-if="itemCount === 0" name="no-items" />
	</div>
</template>

<style lang="scss" scoped>
.v-table {
	--v-table-sticky-offset-top: var(--layout-offset-top);

	display: contents;

	& > :deep(table) {
		min-inline-size: calc(100% - var(--content-padding)) !important;
		margin-inline-start: var(--content-padding);

		tr {
			margin-inline-end: var(--content-padding);
		}
	}
}

.footer {
	position: sticky;
	inset-inline-start: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	inline-size: 100%;
	padding: 32px var(--content-padding);

	.pagination:not(.v-skeleton-loader) {
		display: inline-block;
	}

	.per-page {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		inline-size: 240px;
		color: var(--theme--foreground-subdued);

		span {
			inline-size: auto;
			margin-inline-end: 4px;
		}

		.v-select {
			color: var(--theme--foreground);
		}
	}
}

.add-field {
	--v-icon-color-hover: var(--theme--foreground);

	&.active {
		--v-icon-color: var(--theme--foreground);
	}
}

.flip {
	transform: scaleY(-1);
}
</style>
