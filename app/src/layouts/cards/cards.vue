<template>
	<div class="layout-cards" :style="{ '--size': layoutState.size * 40 + 'px' }" ref="layoutElement">
		<template v-if="layoutState.loading || layoutState.itemCount > 0">
			<cards-header
				@select-all="layoutState.selectAll"
				:fields="layoutState.fieldsInCollection"
				v-model:size="layoutState.size"
				v-model:selection="layoutState.props.selection"
				v-model:sort="layoutState.sort"
			/>

			<div class="grid" :class="{ 'single-row': layoutState.isSingleRow }">
				<template v-if="layoutState.loading">
					<card v-for="n in 6" :key="`loader-${n}`" item-key="loading" loading />
				</template>

				<card
					v-else
					v-for="item in layoutState.items"
					:item-key="layoutState.primaryKeyField.field"
					:key="item[layoutState.primaryKeyField.field]"
					:crop="layoutState.imageFit === 'crop'"
					:icon="layoutState.icon"
					:file="layoutState.imageSource ? item[layoutState.imageSource] : null"
					:item="item"
					:select-mode="
						layoutState.props.selectMode || (layoutState.props.selection && layoutState.props.selection.length > 0)
					"
					:to="layoutState.getLinkForItem(item)"
					:readonly="layoutState.props.readonly"
					v-model="layoutState.props.selection"
				>
					<template #title v-if="layoutState.title">
						<render-template :collection="layoutState.props.collection" :item="item" :template="layoutState.title" />
					</template>
					<template #subtitle v-if="layoutState.subtitle">
						<render-template :collection="layoutState.props.collection" :item="item" :template="layoutState.subtitle" />
					</template>
				</card>
			</div>

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
						:items="['25', '50', '100', '250', '500', '1000']"
						inline
					/>
				</div>
			</div>
		</template>

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

import Card from './components/card.vue';
import CardsHeader from './components/header.vue';
import { useLayoutState } from '@/composables/use-layout';

export default defineComponent({
	components: { Card, CardsHeader },
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();

		return { t, layoutState };
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
