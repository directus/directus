<template>
	<div ref="layoutElement" class="layout-cards" :style="{ '--size': size * 40 + 'px' }">
		<template v-if="loading || itemCount! > 0">
			<cards-header
				v-model:size="sizeWritable"
				v-model:selection="selectionWritable"
				v-model:sort="sortWritable"
				:fields="fieldsInCollection"
				:show-select="showSelect"
				@select-all="selectAll"
			/>

			<div class="grid" :class="{ 'single-row': isSingleRow }">
				<card
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
						<render-template :collection="collection" :item="item" :template="title" />
					</template>
					<template v-if="subtitle" #subtitle>
						<render-template :collection="collection" :item="item" :template="subtitle" />
					</template>
				</card>
			</div>

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
					<v-select :model-value="`${limit}`" :items="pageSizes" inline @update:model-value="limitWritable = +$event" />
				</div>
			</div>
		</template>

		<v-info v-else-if="error" type="danger" :title="t('unexpected_error')" icon="error" center>
			{{ t('unexpected_error_copy') }}

			<template #append>
				<v-error :error="error" />

				<v-button small class="reset-preset" @click="resetPresetAndRefresh">
					{{ t('reset_page_preferences') }}
				</v-button>
			</template>
		</v-info>

		<slot v-else-if="itemCount === 0 && (filter || search)" name="no-results" />
		<slot v-else-if="itemCount === 0" name="no-items" />
	</div>
</template>

<script lang="ts">
export default {
	inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { usePageSize } from '@/composables/use-page-size';
import { Collection } from '@/types/collections';
import { useElementSize, useSync } from '@directus/composables';
import { Field, Filter, Item, ShowSelect } from '@directus/types';
import { Ref, inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Card from './components/card.vue';
import CardsHeader from './components/header.vue';

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
		showSelect?: ShowSelect;
		error?: any;
		itemCount?: number;
		primaryKeyField?: Field;
		imageSource?: string;
		title?: string;
		subtitle?: string;
		info?: Collection;
		filter?: Filter;
		search?: string;
	}>(),
	{
		showSelect: 'multiple',
	}
);

const emit = defineEmits(['update:selection', 'update:limit', 'update:size', 'update:sort', 'update:width']);

const { t } = useI18n();

const selectionWritable = useSync(props, 'selection', emit);
const limitWritable = useSync(props, 'limit', emit);
const sizeWritable = useSync(props, 'size', emit);
const sortWritable = useSync(props, 'sort', emit);

const mainElement = inject<Ref<Element | undefined>>('main-element');

const layoutElement = ref<HTMLElement>();

const { width } = useElementSize(layoutElement);

const { sizes: pageSizes, selected: selectedSize } = usePageSize<string>(
	[25, 50, 100, 250, 500, 1000],
	(value) => String(value),
	props.limit
);

limitWritable.value = selectedSize;

watch(
	() => props.page,
	() => mainElement!.value?.scrollTo({ top: 0, behavior: 'smooth' })
);

watch(width, () => {
	emit('update:width', width.value);
});
</script>

<style lang="scss" scoped>
.layout-cards {
	padding: var(--content-padding);
	padding-top: 0;
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
	padding-top: 40px;

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
