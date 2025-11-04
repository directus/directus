<script setup lang="ts">
import type { StepStartUIPart } from 'ai';

defineProps<{
	part: StepStartUIPart;
}>();
</script>

<template>
	<div class="message-step">
		<v-divider />
	</div>
</template>

<style lang="scss" scoped>
.message-step {
	margin: 1rem 0;
}
</style>
