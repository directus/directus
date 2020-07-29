<template>
	<div class="v-item-group">
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from '@vue/composition-api';
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
		value: {
			type: Array as PropType<(string | number)[]>,
			default: undefined,
		},
		scope: {
			type: String,
			default: 'item-group',
		},
	},
	setup(props, { emit }) {
		const { value: selection, multiple, max, mandatory } = toRefs(props);
		useGroupableParent(
			{
				selection: selection,
				onSelectionChange: (newSelectionValues) => emit('input', newSelectionValues),
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
