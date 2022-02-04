<template>
	<v-list v-if="vertical" class="v-tabs vertical alt-colors" nav>
		<slot />
	</v-list>
	<div v-else class="v-tabs horizontal">
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, provide, ref } from 'vue';
import { useGroupableParent } from '@/composables/groupable';

export default defineComponent({
	props: {
		vertical: {
			type: Boolean,
			default: false,
		},
		modelValue: {
			type: Array as PropType<(string | number)[]>,
			default: undefined,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { modelValue: selection, vertical } = toRefs(props);

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
			emit('update:modelValue', newSelection);
		}

		return { update, items };
	},
});
</script>

<style scoped>
:global(body) {
	--v-tabs-underline-color: var(--foreground-normal);
}

.v-tabs.horizontal {
	position: relative;
	display: inline-flex;
}

.v-tabs.horizontal :slotted(.v-tab) {
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
</style>
