<template>
	<div ref="layoutElement" class="layout-cards" :style="{ '--size': size * 40 + 'px' }">
		<template v-if="loading || itemCount > 0">
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
					:key="item[primaryKeyField.field]"
					v-model="selectionWritable"
					:item-key="primaryKeyField.field"
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
					<v-select
						:model-value="`${limit}`"
						:items="['25', '50', '100', '250', '500', '1000']"
						inline
						@update:model-value="limitWritable = +$event"
					/>
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
import { useI18n } from 'vue-i18n';
import { defineComponent, watch, PropType, ref, inject, Ref } from 'vue';

import Card from './components/card.vue';
import CardsHeader from './components/header.vue';
import { Field, Item } from '@directus/shared/types';
import { useSync, useElementSize } from '@directus/shared/composables';
import { Collection } from '@/types/collections';
import { Filter, ShowSelect } from '@directus/shared/types';

export default defineComponent({
	components: { Card, CardsHeader },
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		selection: {
			type: Array as PropType<Item[]>,
			required: true,
		},
		showSelect: {
			type: String as PropType<ShowSelect>,
			default: 'multiple',
		},
		selectMode: {
			type: Boolean,
			required: true,
		},
		readonly: {
			type: Boolean,
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
		fieldsInCollection: {
			type: Array as PropType<Item[]>,
			required: true,
		},
		limit: {
			type: Number,
			required: true,
		},
		size: {
			type: Number,
			required: true,
		},
		primaryKeyField: {
			type: Object as PropType<Field>,
			default: null,
		},
		icon: {
			type: String,
			required: true,
		},
		imageSource: {
			type: String,
			default: null,
		},
		title: {
			type: String,
			default: null,
		},
		subtitle: {
			type: String,
			default: null,
		},
		getLinkForItem: {
			type: Function as PropType<(item: Record<string, any>) => string | undefined>,
			required: true,
		},
		imageFit: {
			type: String,
			required: true,
		},
		sort: {
			type: Array as PropType<string[]>,
			required: true,
		},
		info: {
			type: Object as PropType<Collection>,
			default: null,
		},
		isSingleRow: {
			type: Boolean,
			required: true,
		},
		width: {
			type: Number,
			required: true,
		},
		selectAll: {
			type: Function as PropType<() => void>,
			required: true,
		},
		resetPresetAndRefresh: {
			type: Function as PropType<() => Promise<void>>,
			required: true,
		},
		filter: {
			type: Object as PropType<Filter>,
			default: null,
		},
		search: {
			type: String,
			default: null,
		},
	},
	emits: ['update:selection', 'update:limit', 'update:size', 'update:sort', 'update:width'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const selectionWritable = useSync(props, 'selection', emit);
		const limitWritable = useSync(props, 'limit', emit);
		const sizeWritable = useSync(props, 'size', emit);
		const sortWritable = useSync(props, 'sort', emit);

		const mainElement = inject<Ref<Element | undefined>>('main-element');

		const layoutElement = ref<HTMLElement>();

		const { width } = useElementSize(layoutElement);

		watch(
			() => props.page,
			() => mainElement.value?.scrollTo({ top: 0, behavior: 'smooth' })
		);

		watch(width, () => {
			emit('update:width', width.value);
		});

		return { t, selectionWritable, limitWritable, sizeWritable, sortWritable, layoutElement };
	},
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
