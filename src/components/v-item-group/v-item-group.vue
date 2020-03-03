<template>
	<div class="v-item-group">
		<slot />
	</div>
</template>

<script lang="ts">
import Vue, { VNode } from 'vue';
import {
	defineComponent,
	ref,
	provide,
	PropType,
	computed,
	Ref,
	watch,
	toRefs
} from '@vue/composition-api';
import { useGroupableParent } from '@/compositions/groupable';
import arraysAreEqual from '@/utils/arrays-are-equal';
import { notEmpty } from '@/utils/is-empty';

export default defineComponent({
	props: {
		mandatory: {
			type: Boolean,
			default: false
		},
		max: {
			type: Number,
			default: -1
		},
		multiple: {
			type: Boolean,
			default: false
		},
		value: {
			type: Array as PropType<(string | number)[]>,
			default: undefined
		}
	},
	setup(props, { emit }) {
		const { value: selection, multiple, max, mandatory } = toRefs(props);
		useGroupableParent(
			{
				selection: selection,
				onSelectionChange: newSelectionValues => emit('input', newSelectionValues)
			},
			{
				multiple: multiple,
				max: max,
				mandatory: mandatory
			}
		);
		return {};
	}
});
</script>
