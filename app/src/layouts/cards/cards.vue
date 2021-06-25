<template>
	<div class="layout-cards" :style="{ '--size': size * 40 + 'px' }" ref="layoutElement">
		<template v-if="loading || itemCount > 0">
			<cards-header
				@select-all="selectAll"
				:fields="fieldsInCollection"
				v-model:size="size"
				v-model:selection="props.selection"
				v-model:sort="sort"
			/>

			<div class="grid" :class="{ 'single-row': isSingleRow }">
				<template v-if="loading">
					<card v-for="n in 6" :key="`loader-${n}`" item-key="loading" loading />
				</template>

				<card
					v-else
					v-for="item in items"
					:item-key="primaryKeyField.field"
					:key="item[primaryKeyField.field]"
					:crop="imageFit === 'crop'"
					:icon="icon"
					:file="imageSource ? item[imageSource] : null"
					:item="item"
					:select-mode="props.selectMode || (props.selection && props.selection.length > 0)"
					:to="getLinkForItem(item)"
					:readonly="props.readonly"
					v-model="props.selection"
				>
					<template #title v-if="title">
						<render-template :collection="props.collection" :item="item" :template="title" />
					</template>
					<template #subtitle v-if="subtitle">
						<render-template :collection="props.collection" :item="item" :template="subtitle" />
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
						@update:model-value="limit = +$event"
						:model-value="`${limit}`"
						:items="['25', '50', '100', '250', '500', '1000']"
						inline
					/>
				</div>
			</div>
		</template>

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
import { defineComponent, watch, toRefs } from 'vue';

import Card from './components/card.vue';
import CardsHeader from './components/header.vue';
import { useLayoutState } from '@directus/shared/composables';
import useElementSize from '@/composables/use-element-size';

export default defineComponent({
	components: { Card, CardsHeader },
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();
		const {
			props,
			items,
			loading,
			error,
			totalPages,
			page,
			toPage,
			itemCount,
			totalCount,
			fieldsInCollection,
			limit,
			size,
			primaryKeyField,
			icon,
			fileFields,
			imageSource,
			title,
			subtitle,
			getLinkForItem,
			imageFit,
			sort,
			newLink,
			info,
			showingCount,
			isSingleRow,
			width,
			layoutElement,
			activeFilterCount,
			refresh,
			selectAll,
			resetPresetAndRefresh,
		} = toRefs(layoutState.value);

		const { width: elementWidth } = useElementSize(layoutElement);

		watch(elementWidth, () => {
			width.value = elementWidth.value;
		});

		return {
			t,
			props,
			items,
			loading,
			error,
			totalPages,
			page,
			toPage,
			itemCount,
			totalCount,
			fieldsInCollection,
			limit,
			size,
			primaryKeyField,
			icon,
			fileFields,
			imageSource,
			title,
			subtitle,
			getLinkForItem,
			imageFit,
			sort,
			newLink,
			info,
			showingCount,
			isSingleRow,
			width,
			layoutElement,
			activeFilterCount,
			refresh,
			selectAll,
			resetPresetAndRefresh,
		};
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
