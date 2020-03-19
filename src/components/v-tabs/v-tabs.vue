<template>
	<div class="v-tabs" :class="{ vertical }">
		<slot />
		<div class="slider" :style="slideStyle"></div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, computed } from '@vue/composition-api';
import { useGroupableParent } from '@/compositions/groupable';

export default defineComponent({
	props: {
		vertical: {
			type: Boolean,
			default: false
		},
		value: {
			type: Array as PropType<(string | number)[]>,
			default: undefined
		}
	},
	setup(props, { emit }) {
		const { value: selection } = toRefs(props);

		const options = toRefs({
			multiple: false,
			max: -1,
			mandatory: true
		});

		const { items } = useGroupableParent(
			{
				selection: selection,
				onSelectionChange: update
			},
			options
		);

		const slideStyle = computed(() => {
			const activeIndex = items.value.findIndex(item => item.active.value);

			return {
				'--_v-tabs-items': items.value.length,
				'--_v-tabs-selected': activeIndex
			};
		});

		function update(newSelection: readonly (string | number)[]) {
			emit('input', newSelection);
		}

		return { update, slideStyle };
	}
});
</script>
<style lang="scss" scoped>
.v-tabs {
	--v-tabs-underline-color: var(--foreground-color);

	position: relative;
	display: flex;

	::v-deep .v-tab {
		display: flex;
		flex-basis: 0px;
		flex-grow: 1;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		height: 44px;
		padding: 12px 20px;
		cursor: pointer;
	}

	.slider {
		position: absolute;
		bottom: 0;
		left: calc(100% / var(--_v-tabs-items) * var(--_v-tabs-selected));
		width: calc(100% / var(--_v-tabs-items));
		height: 2px;
		background-color: var(--v-tabs-underline-color);
		transition: var(--medium) cubic-bezier(0.66, 0, 0.33, 1);
		transition-property: left, top;
	}

	&.vertical {
		flex-direction: column;

		::v-deep .v-tab {
			justify-content: flex-start;
		}

		.slider {
			top: calc(100% / var(--_v-tabs-items) * var(--_v-tabs-selected));
			left: 0;
			width: 2px;
			height: calc(100% / var(--_v-tabs-items));
		}
	}
}
</style>
