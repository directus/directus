<template>
	<ul class="v-list" :class="{ large }">
		<slot />
	</ul>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs } from '@vue/composition-api';
import { useGroupableParent } from '@/composables/groupable';

export default defineComponent({
	model: {
		prop: 'activeItems',
		event: 'input',
	},
	props: {
		activeItems: {
			type: Array as PropType<(number | string)[]>,
			default: () => [],
		},
		large: {
			type: Boolean,
			default: false,
		},
		multiple: {
			type: Boolean,
			default: true,
		},
		mandatory: {
			type: Boolean,
			default: true,
		},
	},
	setup(props, { emit }) {
		const { activeItems, multiple, mandatory } = toRefs(props);
		useGroupableParent(
			{
				selection: activeItems,
				onSelectionChange: (newSelection) => {
					emit('input', newSelection);
				},
			},
			{
				mandatory,
				multiple,
			}
		);

		return {};
	},
});
</script>

<style>
body {
	--v-list-padding: 4px 0;
	--v-list-max-height: none;
	--v-list-max-width: none;
	--v-list-min-width: 220px;
	--v-list-min-height: none;
	--v-list-color: var(--foreground-normal-alt);
	--v-list-color-hover: var(--foreground-normal-alt);
	--v-list-color-active: var(--foreground-normal-alt);
	--v-list-background-color-hover: var(--background-normal);
	--v-list-background-color-active: var(--background-normal);
}
</style>

<style lang="scss" scoped>
.v-list {
	position: static;
	display: block;
	min-width: var(--v-list-min-width);
	max-width: var(--v-list-max-width);
	min-height: var(--v-list-min-height);
	max-height: var(--v-list-max-height);
	padding: var(--v-list-padding);
	overflow: auto;
	color: var(--v-list-color);
	line-height: 22px;
	border-radius: var(--border-radius);

	&.large {
		--v-list-padding: 12px;
	}

	::v-deep .v-divider {
		max-width: calc(100% - 16px);
		margin: 8px;
	}
}
</style>
