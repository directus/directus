<template>
	<sidebar-detail icon="layers" :title="$t('layout_options')">
		<div class="layout-options">
			<div class="field">
				<div class="type-label">{{ $t('layout') }}</div>
				<v-select :items="layouts" item-text="name" item-value="id" item-icon="icon" v-model="layoutId">
					<template v-if="layout.icon" #prepend>
						<v-icon :name="layout.icon" />
					</template>
				</v-select>
			</div>

			<portal-target name="layout-options" class="portal-contents" />
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, PropType } from '@vue/composition-api';
import { LayoutConfig } from '../../../../layouts/types';

export default defineComponent({
	props: {
		layouts: {
			type: Array as PropType<LayoutConfig[]>,
			required: true,
		},
		layout: {
			type: Object as PropType<LayoutConfig>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const layoutId = computed({
			get() {
				return props.layout.id || 'tabular';
			},
			set(newType: string) {
				emit('input', newType);
			},
		});

		return { layoutId };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.portal-contents {
	display: contents;
}

.layout-options ::v-deep {
	--v-form-vertical-gap: 24px;

	.type-label {
		font-size: 1rem;
	}

	@include form-grid;
}
</style>
