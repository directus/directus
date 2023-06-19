<script lang="ts" setup>
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
			<p class="m-10 text-muted">{{ desc }}</p>
			<div v-if="author" class="m-10 gray">
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
.gray {
	color: #747a82;
}
</style>
