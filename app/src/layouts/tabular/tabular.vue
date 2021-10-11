<template>
	<div class="layout-tabular">
		<v-table
			v-if="loading || itemCount > 0"
			ref="table"
			v-model="selectionWritable"
			v-model:headers="tableHeadersWritable"
			class="table"
			fixed-header
			:show-select="readonly ? false : selection !== undefined"
			show-resize
			must-sort
			:sort="tableSort"
			:items="items"
			:loading="loading"
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
			<template v-for="header in tableHeaders" :key="header.value" #[`item.${header.value}`]="{ item }">
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
						<span>{{ t('per_page') }}</span>
						<v-select
							:model-value="`${limit}`"
							:items="['25', '50', '100', '250', '500', ' 1000']"
							inline
							@update:model-value="limitWritable = +$event"
						/>
					</div>
				</div>
			</template>
		</v-table>

		<v-info v-else-if="error" type="danger" :title="t('unexpected_error')" icon="error" center>
			{{ t('unexpected_error_copy') }}

			<template #append>
				<v-error :error="error" />

				<v-button small class="reset-preset" @click="resetPresetAndRefresh">
					{{ t('reset_page_preferences') }}
				</v-button>
			</template>
		</v-info>

		<slot v-else-if="itemCount === 0 && (filterUser || search)" name="no-results" />
		<slot v-else-if="itemCount === 0" name="no-items" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { ComponentPublicInstance, defineComponent, PropType, ref } from 'vue';
import { useSync } from '@directus/shared/composables';
import useShortcut from '@/composables/use-shortcut';
import { Field, Item, Collection, Filter } from '@directus/shared/types';
import { HeaderRaw } from '@/components/v-table/types';

export default defineComponent({
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		selection: {
			type: Array as PropType<Item[]>,
			default: () => [],
		},
		readonly: {
			type: Boolean,
			required: true,
		},
		tableHeaders: {
			type: Array as PropType<HeaderRaw[]>,
			required: true,
		},
		items: {
			type: Array as PropType<Item[]>,
			required: true,
		},
		loading: {
			type: Boolean,
			required: true,
		},
		error: {
			type: Object as PropType<any>,
			default: null,
		},
		totalPages: {
			type: Number,
			required: true,
		},
		tableSort: {
			type: Object as PropType<{ by: string; desc: boolean }>,
			required: true,
		},
		onRowClick: {
			type: Function as PropType<(item: Item) => void>,
			required: true,
		},
		onSortChange: {
			type: Function as PropType<(newSort: { by: string; desc: boolean }) => void>,
			required: true,
		},
		tableRowHeight: {
			type: Number,
			required: true,
		},
		page: {
			type: Number,
			required: true,
		},
		toPage: {
			type: Function as PropType<(newPage: number) => void>,
			required: true,
		},
		itemCount: {
			type: Number,
			default: null,
		},
		fields: {
			type: Array as PropType<string[]>,
			required: true,
		},
		limit: {
			type: Number,
			required: true,
		},
		primaryKeyField: {
			type: Object as PropType<Field>,
			default: null,
		},
		info: {
			type: Object as PropType<Collection>,
			default: null,
		},
		sortField: {
			type: String,
			default: null,
		},
		changeManualSort: {
			type: Function as PropType<(data: any) => Promise<void>>,
			required: true,
		},
		resetPresetAndRefresh: {
			type: Function as PropType<() => Promise<void>>,
			required: true,
		},
		selectAll: {
			type: Function as PropType<() => void>,
			required: true,
		},
		filterUser: {
			type: Object as PropType<Filter>,
			default: null,
		},
		search: {
			type: String,
			default: null,
		},
	},
	emits: ['update:selection', 'update:tableHeaders', 'update:limit'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const selectionWritable = useSync(props, 'selection', emit);
		const tableHeadersWritable = useSync(props, 'tableHeaders', emit);
		const limitWritable = useSync(props, 'limit', emit);

		const table = ref<ComponentPublicInstance>();

		useShortcut(
			'meta+a',
			() => {
				props.selectAll();
			},
			table
		);

		return { t, selectionWritable, tableHeadersWritable, limitWritable, table };
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
