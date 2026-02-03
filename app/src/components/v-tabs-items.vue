<script setup lang="ts">
import VItemGroup from '@/components/v-item-group.vue';

interface Props {
	/** What tab should be currently active */
	modelValue?: (number | string)[];
}

withDefaults(defineProps<Props>(), {
	modelValue: undefined,
});

const emit = defineEmits(['update:modelValue']);

function update(newSelection: readonly (string | number)[]) {
	emit('update:modelValue', newSelection);
}
</script>

<template>
	<VItemGroup class="v-tabs-items" :model-value="modelValue" scope="v-tabs-items" @update:model-value="update">
		<slot />
	</VItemGroup>
</template>
