<template>
	<v-item-group class="v-tabs-items" :model-value="modelValue" scope="v-tabs-items" @update:model-value="update">
		<slot />
	</v-item-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			type: Array as PropType<(string | number)[]>,
			default: undefined,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		function update(newSelection: readonly (string | number)[]) {
			emit('update:modelValue', newSelection);
		}

		return { update };
	},
});
</script>
