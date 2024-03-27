<script setup lang="ts">
import { getFriendlyDate } from '../../lib/date.js';
import type { DocsTag, DeveloperArticle } from '../../types/schema.js';
import Badge from '../Badge.vue';

defineProps<{ tag: DocsTag & { articles: DeveloperArticle[] } }>();
</script>

<template>
	<section class="container">
		<Badge>Posts tagged {{ tag.title }}</Badge>
		<div class="listing">
			<Article
				v-for="article in tag.articles"
				:key="article.slug"
				:title="article.title"
				:author="article.author.first_name + ' ' + article.author.last_name"
				:date="getFriendlyDate(article.date_published)"
				:url="`/blog/${article.slug}`"
				:img="`https://marketing.directus.app/assets/${article.image}?key=card`"
			/>
		</div>
	</section>
</template>

<style scoped>
.container {
	padding: 24px 64px;
}

.listing {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 32px;
	margin-top: 8px;
}

@media only screen and (min-width: 768px) and (max-width: 1200px) {
	.listing {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media only screen and (max-width: 1200px) {
	.container {
		padding-left: 24px;
		padding-right: 24px;
	}
}

@media only screen and (max-width: 768px) {
	.listing {
		grid-template-columns: 1fr;
	}
}
</style>
