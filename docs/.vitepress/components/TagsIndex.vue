<template>
	<div class="">
		<section class="hero padding-box">
			<div class="heroPattern">
				<Pattern />
			</div>
			<div class="hero-content section-padding-hero">
				<h1>Developer Blog</h1>
				<p>Read project tutorials, tips & tricks, and best practices from the Directus team and community.</p>
				<div class="hero-buttons button-group">
					<Button href="/blog/guest-author" primary>Become a Guest Author</Button>
				</div>
			</div>
		</section>
		<section class="page">
			<div class="section-container">
				<Badge>{{ tag.title }}</Badge>
				<div class="grid-3 mt-2">
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
import Pattern from './home/Pattern.vue';
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
	padding: 24px;
}

.mt-2 {
	margin-top: 8px;
}
.padding-box {
	padding: 0 32px;
}

.section-padding-hero {
	padding-block: 64px;
}

.hero {
	position: relative;
	overflow: hidden;
	border-radius: 12px;
}

.subtext {
	color: var(--vp-c-gray-light-1);
}

.heroPattern {
	position: absolute;
	top: 40%;
	left: 50%;
	translate: -50% -50%;
	pointer-events: none;
}

.heroPattern svg {
	width: 1600px;
	height: 1000px;
	opacity: 0.5;
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

.hero-buttonsbutton-group {
	margin: 24px 0;
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

@media only screen and (max-width: 1200px) {
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
