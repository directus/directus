<template>
	<sidebar-detail icon="layers" :title="t('layout_options')">
		<div class="layout-options">
			<div class="field">
				<div class="type-label">{{ t('layout') }}</div>
				<v-select v-model="layout" :items="layouts" item-text="name" item-value="id" item-icon="icon">
					<template v-if="currentLayout.icon" #prepend>
						<v-icon :name="currentLayout.icon" />
					</template>
				</v-select>
			</div>

			<slot />
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { getLayouts } from '@/layouts';
import { useSync } from '@directus/shared/composables';

export default defineComponent({
	props: {
		modelValue: {
			type: String,
			default: 'tabular',
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const { layouts } = getLayouts();

		const currentLayout = computed(() => {
			const layout = layouts.value.find((layout) => layout.id === props.modelValue);

			if (layout === undefined) {
				return layouts.value.find((layout) => layout.id === 'tabular');
			}

			return layout;
		});

		const layout = useSync(props, 'modelValue', emit);

		return { t, currentLayout, layouts, layout };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

:deep(.layout-options) {
	--form-vertical-gap: 24px;

	@include form-grid;
}

:deep(.layout-options .type-label) {
	font-size: 1rem;
}
</style>
