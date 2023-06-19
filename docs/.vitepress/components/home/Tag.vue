<script lang="ts" setup>
defineProps<{
	tag?: string;
}>();
</script>

<template>
	<p class="tag">{{ tag }}</p>
</template>

<style scoped>
.tag {
	background: #f0ecff;
	text-transform: capitalize;
	border-radius: 6px;
	color: #6644ff;
	display: inline-block;
	font-size: 12px;
	font-weight: 500;
	margin: 12px 0;
	padding: 4px 8px;
}
</style>
