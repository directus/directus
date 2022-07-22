<template>
	<div class="v-item-group">
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from 'vue';
import { useGroupableParent } from '@/composables/groupable';

export default defineComponent({
	props: {
		mandatory: {
			type: Boolean,
			default: false,
		},
		max: {
			type: Number,
			default: -1,
		},
		multiple: {
			type: Boolean,
			default: false,
		},
		modelValue: {
			type: Array as PropType<(string | number)[]>,
			default: undefined,
		},
		scope: {
			type: String,
			default: 'item-group',
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { modelValue: selection, multiple, max, mandatory } = toRefs(props);
		useGroupableParent(
			{
				selection: selection,
				onSelectionChange: (newSelectionValues) => emit('update:modelValue', newSelectionValues),
			},
			{
				multiple: multiple,
				max: max,
				mandatory: mandatory,
			},
			props.scope
		);
		return {};
	},
});
</script>
