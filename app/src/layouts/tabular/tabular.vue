<template>
	<div class="layout-tabular">
		<v-table
			v-model="layoutState.props.selection"
			v-if="layoutState.loading || layoutState.itemCount > 0"
			class="table"
			ref="table"
			fixed-header
			:show-select="layoutState.props.readonly ? false : layoutState.props.selection !== undefined"
			show-resize
			must-sort
			:sort="layoutState.tableSort"
			:items="layoutState.items"
			:loading="layoutState.loading"
			v-model:headers="layoutState.tableHeaders"
			:row-height="layoutState.tableRowHeight"
			:server-sort="layoutState.itemCount === layoutState.limit || layoutState.totalPages > 1"
			:item-key="layoutState.primaryKeyField.field"
			:show-manual-sort="layoutState.sortField !== null"
			:manual-sort-key="layoutState.sortField"
			selection-use-keys
			@click:row="layoutState.onRowClick"
			@update:sort="layoutState.onSortChange"
			@manual-sort="layoutState.changeManualSort"
		>
			<template
				v-for="header in layoutState.tableHeaders"
				:key="header.value"
				v-slot:[`item.${header.value}`]="{ item }"
			>
				<render-display
					:value="item[header.value]"
					:display="header.field.display"
					:options="header.field.displayOptions"
					:interface="header.field.interface"
					:interface-options="header.field.interfaceOptions"
					:type="header.field.type"
					:collection="layoutState.props.collection"
					:field="header.field.field"
				/>
			</template>

			<template #footer>
				<div class="footer">
					<div class="pagination">
						<v-pagination
							v-if="layoutState.totalPages > 1"
							:length="layoutState.totalPages"
							:total-visible="7"
							show-first-last
							:model-value="layoutState.page"
							@update:model-value="layoutState.toPage"
						/>
					</div>

					<div v-if="layoutState.loading === false && layoutState.items.length >= 25" class="per-page">
						<span>{{ t('per_page') }}</span>
						<v-select
							@update:model-value="layoutState.limit = +$event"
							:model-value="`${layoutState.limit}`"
							:items="['25', '50', '100', '250', '500', ' 1000']"
							inline
						/>
					</div>
				</div>
			</template>
		</v-table>

		<v-info v-else-if="layoutState.error" type="danger" :title="t('unexpected_error')" icon="error" center>
			{{ t('unexpected_error_copy') }}

			<template #append>
				<v-error :error="layoutState.error" />

				<v-button small @click="layoutState.resetPresetAndRefresh" class="reset-preset">
					{{ t('reset_page_preferences') }}
				</v-button>
			</template>
		</v-info>

		<slot v-else-if="layoutState.itemCount === 0 && layoutState.activeFilterCount > 0" name="no-results" />
		<slot v-else-if="layoutState.itemCount === 0" name="no-items" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent } from 'vue';

import { useLayoutState } from '@/composables/use-layout';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();

		return { t, layoutState };
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

.reset-preset {
	margin-top: 24px;
}
</style>
