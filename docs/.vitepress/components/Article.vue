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

<template>
	<div class="article">
		<a :href="url">
			<div class="image">
				<img :src="img" alt="" loading="lazy" />
			</div>
			<div class="content">
				<h3 class="heading">{{ title }}</h3>
				<p v-if="desc" class="description">{{ desc }}</p>
				<div v-if="author" class="author">
					<span>{{ author }}</span>
					<span>•</span>
					<span class="date">{{ date }}</span>
				</div>
			</div>
		</a>
	</div>
</template>

<style scoped>
.article {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.article a {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.content {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
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

.dark .image img {
	filter: brightness(0.9);
}

.heading {
	font-weight: 600;
	margin-top: 12px;
}

.description {
	color: var(--vp-c-text-2);
	padding-inline-end: 8px;
}

.author {
	color: var(--vp-c-gray);
	display: flex;
	gap: 0.5em;
	margin-top: 0.25em;
	font-size: 0.8em;
}

.article:hover .heading {
	text-decoration: underline;
}

.article:hover .image img {
	scale: 1.05;
}
</style>
