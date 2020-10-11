<template>
	<v-list class="v-tabs vertical alt-colors" v-if="vertical" large>
		<slot />
	</v-list>
	<div v-else class="v-tabs horizontal">
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, computed, provide, ref } from '@vue/composition-api';
import { useGroupableParent } from '@/composables/groupable';

export default defineComponent({
	props: {
		vertical: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Array as PropType<(string | number)[]>,
			default: undefined,
		},
	},
	setup(props, { emit }) {
		const { value: selection, vertical } = toRefs(props);

		provide('v-tabs-vertical', vertical);

		const { items } = useGroupableParent(
			{
				selection: selection,
				onSelectionChange: update,
			},
			{
				multiple: ref(false),
				mandatory: ref(true),
			},
			'v-tabs'
		);

		function update(newSelection: readonly (string | number)[]) {
			emit('input', newSelection);
		}

		return { update, items };
	},
});
</script>

<style>
body {
	--v-tabs-underline-color: var(--foreground-normal);
}
</style>

<style lang="scss" scoped>
.v-tabs.horizontal {
	position: relative;
	display: inline-flex;

	::v-deep .v-tab {
		display: flex;
		flex-basis: 0px;
		flex-grow: 1;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		height: 38px;
		padding: 8px 20px;
		cursor: pointer;
	}
}
</style>
