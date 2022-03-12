<template>
	<div class="layout-tabular">
		<v-table
			v-if="loading || (itemCount && itemCount > 0)"
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
			:server-sort="itemCount === limit || totalPages > 1"
			:item-key="primaryKeyField?.field"
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

			<template #header-append>
				<v-icon name="add" />
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
export default {
	inheritAttrs: false,
};
</script>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { ComponentPublicInstance, ref, inject, Ref, watch } from 'vue';
import { useSync } from '@directus/shared/composables';
import useShortcut from '@/composables/use-shortcut';
import { Collection } from '@/types';
import { Field, Item, Filter, ShowSelect } from '@directus/shared/types';
import { HeaderRaw } from '@/components/v-table/types';

interface Props {
	collection: string;
	selection?: Item[];
	readonly: boolean;
	tableHeaders: HeaderRaw[];
	showSelect?: ShowSelect;
	items: Item[];
	loading: boolean;
	error?: any;
	totalPages: number;
	tableSort: { by: string; desc: boolean };
	onRowClick: (item: Item) => void;
	onSortChange: (newSort: { by: string; desc: boolean }) => void;
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
}

const props = withDefaults(defineProps<Props>(), {
	selection: () => [],
	showSelect: 'none',
	error: null,
	itemCount: undefined,
	primaryKeyField: undefined,
	info: undefined,
	sortField: undefined,
	filterUser: undefined,
	search: undefined,
});

const emit = defineEmits(['update:selection', 'update:tableHeaders', 'update:limit']);

const { t } = useI18n();

const selectionWritable = useSync(props, 'selection', emit);
const tableHeadersWritable = useSync(props, 'tableHeaders', emit);
const limitWritable = useSync(props, 'limit', emit);

const mainElement = inject<Ref<Element | undefined>>('main-element');

const table = ref<ComponentPublicInstance>();

watch(
	() => props.page,
	() => mainElement?.value?.scrollTo({ top: 0, behavior: 'smooth' })
);

useShortcut(
	'meta+a',
	() => {
		props.selectAll();
	},
	table
);
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
