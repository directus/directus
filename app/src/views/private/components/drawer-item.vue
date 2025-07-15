<script setup lang="ts">
import OverlayItem, { type OverlayItemProps, type OverlayItemEmits } from './overlay-item.vue';

defineProps<OverlayItemProps>();
defineEmits<OverlayItemEmits>();
</script>

<template>
	<overlay-item
		v-bind="$props"
		overlay="drawer"
		@update:active="$emit('update:active', $event)"
		@input="$emit('input', $event)"
	>
		<template #actions>
			<slot name="actions" />
		</template>
	</overlay-item>
</template>
