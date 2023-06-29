<template>
	<p class="tag">{{ tag }}</p>
</template>

<script lang="ts" setup>
defineProps<{
	tag?: string;
}>();
</script>

<style scoped>
.tag {
	background: #f0ecff;
	border-radius: 6px;
	color: var(--vp-c-purple);
	display: inline-block;
	font-size: 12px;
	font-weight: 500;
	margin: 8px 0;
	padding: 2px 8px;
}
</style>
