<template>
	<v-item-group class="v-tabs-items" :modelValue="value" @update:modelValue="update">
		<slot />
	</v-item-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
	emits: ['input'],
	props: {
		value: {
			type: Array as PropType<(string | number)[]>,
			default: undefined,
		},
	},
	setup(props, { emit }) {
		function update(newSelection: readonly (string | number)[]) {
			emit('input', newSelection);
		}

		return { update };
	},
});
</script>
