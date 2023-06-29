<script setup lang="ts">
defineProps<{
	title: string;
	desc?: string;
	url: string;
	img: string;
}>();
</script>

<template>
	<div class="sh">
		<img :src="img" alt="" class="sh-img" />
		<h3 class="sh-title m-10">{{ title }}</h3>
		<p class="text-muted">{{ desc }}</p>
		<a :href="url" class="outline-btn">Read More</a>
	</div>
</template>

<style scoped>
.sh-img {
	width: 100%;
	max-height: 220px;
	object-fit: cover;
	border-radius: 8px;
}

.sh-title {
	font-size: 18px;
	font-weight: 600;
}
</style>
