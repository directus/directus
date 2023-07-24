<template>
	<div class="article">
		<a :href="url">
			<div class="image">
				<img :src="img" alt="" />
			</div>
			<h3 class="heading">{{ title }}</h3>
			<p class="description">{{ desc }}</p>
			<div v-if="author" class="author">
				<span>{{ author }}</span>
				&nbsp;
				<span>•</span>
				&nbsp;
				<span>{{ date }}</span>
			</div>
		</a>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	title: string;
	tag?: string;
	url: string;
	img: string;
	author?: string;
	date?: string;
	desc?: string;
}>();
</script>

<style scoped>
.heading {
	font-weight: 600;
	margin-top: 12px;
}

.image {
	width: 100%;
	border-radius: 8px;
	aspect-ratio: 16 / 9;
	overflow: hidden;
}

.image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	object-position: center center;
	transition: scale 150ms ease-out;
}

.description {
	color: var(--vp-c-text-2);
	padding-inline-end: 8px;
}

.author {
	color: var(--vp-c-gray);
}

.article:hover .heading {
	text-decoration: underline;
}

.article:hover .image img {
	scale: 1.05;
}
</style>
