<template>
	<sidebar-detail icon="layers" :title="$t('layout_options')">
		<div class="layout-options">
			<div class="field">
				<div class="type-label">{{ $t('layout') }}</div>
				<v-select :items="layouts" item-text="name" item-value="id" item-icon="icon" v-model="layout">
					<template v-if="currentLayout.icon" #prepend>
						<v-icon :name="currentLayout.icon" />
					</template>
				</v-select>
			</div>

			<portal-target name="layout-options" class="portal-contents" />
		</div>
	</sidebar-detail>
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
		const { layouts } = getLayouts();

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
@import '@/styles/mixins/form-grid';

.portal-contents {
	display: contents;
}

.layout-options ::v-deep {
	--form-vertical-gap: 24px;

	.type-label {
		font-size: 1rem;
	}

	@include form-grid;
}
</style>
