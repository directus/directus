<script setup lang="ts">
defineProps<{
	readme: string;
}>();
</script>

<template>
	<div v-md="readme" class="readme" />
</template>

<style scoped lang="scss">
.readme {
	:deep() {
		@import '@/styles/markdown';
	}

	:deep(* + *) {
		margin-top: 1rem;
	}
}
</style>
