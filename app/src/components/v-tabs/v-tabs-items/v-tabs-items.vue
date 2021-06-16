<template>
	<v-item-group class="v-tabs-items" :model-value="modelValue" @update:model-value="update">
		<slot />
	</v-item-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
	emits: ['update:modelValue'],
	props: {
		modelValue: {
			type: Array as PropType<(string | number)[]>,
			default: undefined,
		},
	},
	setup(props, { emit }) {
		function update(newSelection: readonly (string | number)[]) {
			emit('update:modelValue', newSelection);
		}

		return { update };
	},
});
</script>
