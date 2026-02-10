<script setup lang="ts">
import { ShowSelect } from '@directus/types';
import { clamp } from 'lodash';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import type { Sort } from '@/components/v-table/types';
import type { ListRelationHeader } from '@/composables/use-list-relation';
import type { DisplayItem } from '@/composables/use-relation-multiple';
import ListRelationList from '@/interfaces/shared/list-relation-list.vue';
import ListRelationPagination from '@/interfaces/shared/list-relation-pagination.vue';
import ListRelationTable from '@/interfaces/shared/list-relation-table.vue';
import ListRelationToolbar from '@/interfaces/shared/list-relation-toolbar.vue';
import { LAYOUTS } from '@/types/interfaces';

const _props = defineProps<{
	layout: string;
	width: string;
	disabled: boolean;
	nonEditable: boolean;
	totalItemCount: number;
	showingCount: string;
	pageCount: number;
	loading: boolean;
	displayItems: DisplayItem[];
	headers: ListRelationHeader[];
	tableRowHeight: number;
	limit: number;
	page: number;
	allowDrag: boolean;
	enableSearchFilter: boolean;
	enableLink: boolean;
	displayCollection: string;
	itemKey: string;
	sortField: string | undefined;
	sort: Sort | null | undefined;
	templateForList: string;
	showBatchEdit: boolean;
	showSelectButton: boolean;
	showCreateButton: boolean;
	selectButtonTooltip?: string;
	createButtonTooltip?: string;
	showCreateInList: boolean;
	showSelectInList: boolean;
	showManualSort: boolean;
	showSelect: ShowSelect | undefined;
	deleteAllowed: boolean;
	relationInfo: any;
	search: string;
	searchFilter: any;
	enableCreate: boolean;
	selection: DisplayItem[];
	getLinkForItem: (item: DisplayItem) => string | null;
	getItemEdits: (item: DisplayItem) => Record<string, any>;
	isLocalItem: (item: DisplayItem) => boolean;
	deleteItem: (item: DisplayItem) => void;
}>();

const emit = defineEmits<{
	'update:search': [value: string];
	'update:searchFilter': [value: any];
	'update:sort': [value: Sort | null | undefined];
	'update:headers': [value: ListRelationHeader[]];
	'update:selection': [value: DisplayItem[]];
	'update:page': [value: number];
	'update:limit': [value: number];
	'click:row': [payload: { item: DisplayItem }];
	'update:items': [value: DisplayItem[]];
	batchEdit: [];
	openSelect: [];
	create: [];
}>();
</script>

<template>
	<div :class="[`layout-${layout}`, { bordered: layout === LAYOUTS.TABLE, disabled, 'non-editable': nonEditable }]">
		<ListRelationToolbar
			v-if="layout === LAYOUTS.TABLE"
			:width="width"
			:total-item-count="totalItemCount"
			:showing-count="showingCount"
			:search="search"
			:search-filter="searchFilter"
			:enable-search-filter="enableSearchFilter"
			:disabled="disabled"
			:non-editable="nonEditable"
			:display-collection="displayCollection"
			:show-batch-edit="showBatchEdit"
			:show-select-button="showSelectButton"
			:show-create-button="showCreateButton"
			:select-button-tooltip="selectButtonTooltip"
			:create-button-tooltip="createButtonTooltip"
			:enable-create="enableCreate"
			@update:search="emit('update:search', $event)"
			@update:search-filter="emit('update:searchFilter', $event)"
			@batch-edit="emit('batchEdit')"
			@open-select="emit('openSelect')"
			@create="emit('create')"
		/>

		<ListRelationTable
			v-if="layout === LAYOUTS.TABLE"
			:sort="sort"
			:headers="headers"
			:selection="selection"
			:total-item-count="totalItemCount"
			:loading="loading"
			:display-items="displayItems"
			:item-key="itemKey"
			:table-row-height="tableRowHeight"
			:show-manual-sort="showManualSort"
			:sort-field="sortField"
			:show-select="showSelect"
			:disabled="disabled"
			:non-editable="nonEditable"
			:display-collection="displayCollection"
			:relation-info="relationInfo"
			:enable-link="enableLink"
			:delete-allowed="deleteAllowed"
			:get-link-for-item="getLinkForItem"
			:get-item-edits="getItemEdits"
			:is-local-item="isLocalItem"
			:delete-item="deleteItem"
			@update:sort="emit('update:sort', $event)"
			@update:headers="emit('update:headers', $event)"
			@update:selection="emit('update:selection', $event)"
			@click:row="emit('click:row', $event)"
			@update:items="emit('update:items', $event)"
		/>

		<template v-else-if="loading">
			<VSkeletonLoader
				v-for="num in clamp(totalItemCount - (page - 1) * limit, 1, limit)"
				:key="num"
				:type="totalItemCount > 4 ? 'block-list-item-dense' : 'block-list-item'"
			/>
		</template>

		<ListRelationList
			v-else
			:display-items="displayItems"
			:total-item-count="totalItemCount"
			:template-for-list="templateForList"
			:display-collection="displayCollection"
			:relation-info="relationInfo"
			:disabled="disabled"
			:non-editable="nonEditable"
			:allow-drag="allowDrag"
			:enable-link="enableLink"
			:delete-allowed="deleteAllowed"
			:get-link-for-item="getLinkForItem"
			:get-item-edits="getItemEdits"
			:is-local-item="isLocalItem"
			:delete-item="deleteItem"
			@update:items="emit('update:items', $event)"
			@click:item="(item: DisplayItem) => emit('click:row', { item })"
		/>

		<ListRelationPagination
			:layout="layout"
			:page-count="pageCount"
			:page="page"
			:limit="limit"
			:width="width"
			:loading="loading"
			:disabled="disabled"
			:non-editable="nonEditable"
			:show-create-in-list="showCreateInList"
			:show-select-in-list="showSelectInList"
			@update:page="emit('update:page', $event)"
			@update:limit="emit('update:limit', $event)"
			@create="emit('create')"
			@open-select="emit('openSelect')"
		/>
	</div>
</template>

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

:deep(.v-table .deleted) {
	color: var(--danger-75);
}

:deep(.v-list) {
	@include mixins.list-interface($deleteable: true);
}

:deep(.v-list-item.disabled) {
	--v-list-item-background-color: var(--theme--form--field--input--background-subdued);
}

:deep(.item-actions) {
	@include mixins.list-interface-item-actions($item-link: true);
}

:deep(.actions) {
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
		align-self: stretch;

		.search-input {
			block-size: 100%;
			box-sizing: border-box;
		}

		.search-badge {
			block-size: 100%;
		}
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

			.search-input,
			.search-badge {
				inline-size: 100% !important;
			}
		}
	}
}

:deep(.per-page) {
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

		.disabled {
			color: var(--theme--foreground-subdued);
		}
	}
}
</style>
