<template>
	<v-item-group class="v-tabs-items" :model-value="modelValue" scope="v-tabs-items" @update:model-value="update">
		<slot />
	</v-item-group>
</template>

<script setup lang="ts">
interface Props {
	modelValue?: (number | string)[];
}

defineProps<Props>();

const emit = defineEmits(['update:modelValue']);

function update(newSelection: readonly (string | number)[]) {
	emit('update:modelValue', newSelection);
}
</script>
