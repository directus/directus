<template>
	<drawer-detail icon="layers" :title="$t('layout_options')">
		<div class="option-label">{{ $t('layout') }}</div>
		<v-select :items="layouts" item-text="name" item-value="id" v-model="layout" />
		<portal-target name="layout-options" class="layout-options" />
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { getLayouts } from '@/layouts';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: 'tabular',
		},
	},
	setup(props, { emit }) {
		const layouts = getLayouts();

		const currentLayout = computed(() => {
			const layout = layouts.value.find((layout) => layout.id === props.value);

			if (layout === undefined) {
				return layouts.value.find((layout) => layout.id === 'tabular');
			}

			return layout;
		});

		const layout = computed({
			get() {
				return props.value;
			},
			set(newType: string) {
				emit('input', newType);
			},
		});

		return { currentLayout, layouts, layout };
	},
});
</script>

<style lang="scss" scoped>
.layout-options {
	.layout-option {
		margin-top: 24px;

		&:last-of-type {
			margin-bottom: 12px;
		}
	}

	> .layout-option:first-of-type {
		padding-top: 20px;
		border-top: 2px solid var(--border-normal);
	}
}

.option-label {
	margin-bottom: 4px;
	font-weight: 600;
}

.v-detail {
	margin-top: 24px;
	margin-bottom: 12px;
}
</style>
