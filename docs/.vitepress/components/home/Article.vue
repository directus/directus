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

<template>
	<div class="vp-docs">
		<a :href="url">
			<img :src="img" alt="" class="article-img" />
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

<style scoped>
.article-heading {
	font-weight: 600;
}
.article-img {
	width: 100%;
	object-fit: contain;
	border-radius: 8px;
}
.gray {
	color: var(--vp-c-gray);
}
</style>
