<template>
	<div class="article">
		<a :href="url">
			<div class="article-img">
				<img :src="img" alt="" />
			</div>
			<Tag :tag="tag" />
			<h3 class="sub-headline article-heading">{{ title }}</h3>
			<p class="m-6 text-muted">{{ desc }}</p>
			<div v-if="author" class="m-6 gray">
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
import Tag from './Tag.vue';

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
.article-heading {
	font-weight: 600;
}

.article-img {
	width: 100%;
	border-radius: 8px;
	aspect-ratio: 16 / 9;
	overflow: hidden;
}

.article-img img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	object-position: center center;
	transition: scale 150ms ease-out;
}

.gray {
	color: var(--vp-c-gray);
}

.article:hover .article-heading {
	text-decoration: underline;
}

.article:hover .article-img img {
	scale: 1.05;
}
</style>
