<template>
	<sidebar-detail icon="layers" :title="t('layout_options')">
		<div class="layout-options">
			<div class="field">
				<div class="type-label">{{ t('layout') }}</div>
				<v-select :items="layouts" item-text="name" item-value="id" item-icon="icon" v-model="layout">
					<template v-if="currentLayout.icon" #prepend>
						<v-icon :name="currentLayout.icon" />
					</template>
				</v-select>
			</div>

			<component :is="`layout-options-${layout}`" />
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { getLayouts } from '@/layouts';

export default defineComponent({
	emits: ['update:modelValue'],
	props: {
		modelValue: {
			type: String,
			default: 'tabular',
		},
	},
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

		const layout = computed({
			get() {
				return props.modelValue;
			},
			set(newType: string) {
				emit('update:modelValue', newType);
			},
		});

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
