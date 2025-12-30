<script setup lang="ts">
import Card from './components/card.vue';
import CardsHeader from './components/header.vue';
import VPagination from '@/components/v-pagination.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { usePageSize } from '@/composables/use-page-size';
import { Collection } from '@/types/collections';
import RenderTemplate from '@/views/private/components/render-template.vue';
import { useElementSize, useSync } from '@directus/composables';
import type { Field, Filter, Item, ShowSelect } from '@directus/types';
import { inject, ref, Ref, watch } from 'vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		collection: string;
		items: Item[];
		selection: (number | string)[];
		selectMode: boolean;
		readonly: boolean;
		limit: number;
		size: number;
		icon: string;
		imageFit: string;
		isSingleRow: boolean;
		width: number;
		totalPages: number;
		page: number;
		toPage: (newPage: number) => void;
		getLinkForItem: (item: Record<string, any>) => string | undefined;
		fieldsInCollection: Field[];
		selectAll: () => void;
		resetPresetAndRefresh: () => Promise<void>;
		sort: string[];
		loading: boolean;
		loadingItemCount: boolean;
		showSelect?: ShowSelect;
		error?: any;
		itemCount: number | null;
		totalCount: number | null;
		primaryKeyField?: Field;
		imageSource?: string;
		title?: string;
		subtitle?: string;
		info?: Collection;
		filterUser?: Filter;
		search?: string;
	}>(),
	{
		showSelect: 'multiple',
	},
);

const emit = defineEmits(['update:selection', 'update:limit', 'update:size', 'update:sort', 'update:width']);

const selectionWritable = useSync(props, 'selection', emit);
const limitWritable = useSync(props, 'limit', emit);
const sizeWritable = useSync(props, 'size', emit);
const sortWritable = useSync(props, 'sort', emit);

const mainElement = inject<Ref<Element | undefined>>('main-element');

const layoutElement = ref<HTMLElement>();

const { width: innerWidth } = useElementSize(layoutElement);

const { sizes: pageSizes, selected: selectedSize } = usePageSize<string>(
	[25, 50, 100, 250, 500, 1000],
	(value) => String(value),
	props.limit,
);

if (limitWritable.value !== selectedSize) {
	limitWritable.value = selectedSize;
}

watch(
	() => props.page,
	() => mainElement!.value?.scrollTo({ top: 0, behavior: 'smooth' }),
);

watch(innerWidth, (value) => {
	emit('update:width', value);
});
</script>

<template>
	<div ref="layoutElement" class="layout-cards" :style="{ '--size': size * 40 + 'px' }">
		<template v-if="loading || (items.length > 0 && !error)">
			<CardsHeader
				v-model:size="sizeWritable"
				v-model:selection="selectionWritable"
				v-model:sort="sortWritable"
				:fields="fieldsInCollection"
				:show-select="showSelect"
				@select-all="selectAll"
			/>

			<VProgressCircular v-if="loading" indeterminate rounded />

			<div v-else class="grid" :class="{ 'single-row': isSingleRow }">
				<Card
					v-for="item in items"
					:key="item[primaryKeyField!.field]"
					v-model="selectionWritable"
					:item-key="primaryKeyField!.field"
					:crop="imageFit === 'crop'"
					:icon="icon"
					:file="imageSource ? item[imageSource] : null"
					:item="item"
					:select-mode="selectMode || (selection && selection.length > 0)"
					:to="getLinkForItem(item)"
					:readonly="readonly"
				>
					<template v-if="title" #title>
						<RenderTemplate :collection="collection" :item="item" :template="title" />
					</template>
					<template v-if="subtitle" #subtitle>
						<RenderTemplate :collection="collection" :item="item" :template="subtitle" />
					</template>
				</Card>
			</div>

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

				<div v-if="loading === false && items.length >= 25" class="per-page">
					<span>{{ $t('per_page') }}</span>
					<VSelect :model-value="`${limit}`" :items="pageSizes" inline @update:model-value="limitWritable = +$event" />
				</div>
			</div>
		</template>

		<slot v-else-if="error" name="error" :error="error" :reset="resetPresetAndRefresh" />
		<slot v-else-if="itemCount === 0 && (filterUser || search)" name="no-results" />
		<slot v-else-if="totalCount === 0" name="no-items" />
	</div>
</template>

<style lang="scss" scoped>
.layout-cards {
	padding: var(--content-padding);
	padding-block-start: 0;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(var(--size), 1fr));
	gap: 32px 24px;

	&.single-row {
		grid-template-columns: repeat(auto-fit, var(--size));
	}
}

.footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-block-start: 40px;

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
</style>
