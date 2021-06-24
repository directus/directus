<template>
	<div class="layout-tabular">
		<v-table
			v-model="props.selection"
			v-if="loading || itemCount > 0"
			class="table"
			ref="table"
			fixed-header
			:show-select="props.readonly ? false : props.selection !== undefined"
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
					:collection="props.collection"
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
						<span>{{ t('per_page') }}</span>
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

		<v-info v-else-if="error" type="danger" :title="t('unexpected_error')" icon="error" center>
			{{ t('unexpected_error_copy') }}

			<template #append>
				<v-error :error="error" />

				<v-button small @click="resetPresetAndRefresh" class="reset-preset">
					{{ t('reset_page_preferences') }}
				</v-button>
			</template>
		</v-info>

		<slot v-else-if="itemCount === 0 && activeFilterCount > 0" name="no-results" />
		<slot v-else-if="itemCount === 0" name="no-items" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs } from 'vue';

import { useLayoutState } from '@directus/shared/composables';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();
		const {
			props,
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
		} = toRefs(layoutState.value);

		return {
			t,
			props,
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
	},
});
</script>

<style lang="scss" scoped>
.layout-tabular {
	display: contents;
	margin: var(--content-padding);
	margin-bottom: var(--content-padding-bottom);
}

.v-table {
	--v-table-sticky-offset-top: var(--layout-offset-top);

	display: contents;

	& > :deep(table) {
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

.reset-preset {
	margin-top: 24px;
}
</style>
