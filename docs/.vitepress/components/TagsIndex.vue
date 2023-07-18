<template>
	<div class="">
		<section class="hero padding-box">
			<div class="hero-content section-padding-hero">
				<h1>Directus Developer Blog</h1>
				<p>Project tutorials, tips & tricks, and best practices from the Directus team and community.</p>
				<div class="hero-buttons button-group">
					<Button href="/blog/guest-author" primary>Become a Guest Author</Button>
				</div>
			</div>
		</section>
		<section class="page">
			<div class="section-container">
				<Badge>Posts tagged {{ tag.title }}</Badge>
				<div class="grid-3 md-grid-2 mt-2">
					<Article
						v-for="article in tag.articles"
						:key="article.id"
						:title="article.title"
						:desc="article.description"
						:author="article.author.first_name + ' ' + article.author.last_name"
						:date="getFriendlyDate(article.date_published)"
						:url="`/blog/${article.slug}`"
						:img="`https://marketing.directus.app/assets/${article.image}?key=card`"
					/>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { getFriendlyDate } from '../utils/time.js';
import Badge from './Badge.vue';

const props = defineProps({
	tag: {
		type: Object,
		required: true,
	},
});
</script>

<style scoped>
.page {
	padding: 24px 64px;
}

.mt-2 {
	margin-top: 8px;
}
.padding-box {
	padding: 0 64px;
}

.section-padding-hero {
	padding-block: 32px;
}

.hero-content {
	position: relative;
}

.hero-content h1 {
	font-size: 60px;
	font-weight: 700;
	line-height: 1;
	margin: 20px 0;
}

.hero-content p {
	max-inline-size: 50ch;
	margin: 20px 0;
}

.hero-buttons {
	margin: 0;
}
.flex {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.grid-3 {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 32px;
}

.buttonGroup {
	display: inline-flex;
	gap: 32px;
}

@media only screen and (min-width: 768px) and (max-width: 1200px) {
	.grid-3.md-grid-2 {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media only screen and (max-width: 1200px) {
	.page {
		padding: 24px 32px;
	}
	.padding-box {
		padding: 0 32px;
	}
}

@media only screen and (max-width: 768px) {
	.hero {
		min-height: unset;
	}
	.flex {
		flex-direction: column;
		align-items: stretch;
	}

	.grid-2,
	.grid-3 {
		grid-template-columns: 1fr;
	}

	.hero-content h1 {
		font-size: 42px;
	}

	.section-padding-hero {
		padding-block: 32px;
	}
}
</style>
