<template>
	<div class="">
		<section class="hero paddingBox">
			<div class="heroPattern">
				<Pattern />
			</div>
			<div class="sectionContainer flex">
				<div class="heroContent sectionPaddingHero">
					<h1>Developer Blog</h1>
					<p>Read project tutorials, tips & tricks, and best practices from the Directus team and community.</p>
					<div class="heroButtons buttonGroup">
						<Button href="/blog/guest-author" primary>Become a Guest Author</Button>
					</div>
				</div>
				<div class="heroToggler">
					<Badge>Featured Article</Badge>
					<Article
						v-for="article in [data.blog.articles[0]]"
						:key="article.id"
						:title="article.title"
						:desc="article.description"
						:author="article.user_created.first_name + ' ' + article.user_created.last_name"
						:date="getFriendlyDate(article.publish_date)"
						:url="`/blog/${article.id}`"
						:img="`https://marketing.directus.app/assets/${article.image}?key=card`"
					/>
				</div>
			</div>
		</section>
		<section class="page">
			<div class="sectionContainer">
				<Badge>All Articles</Badge>
				<div class="grid2">
					<Article
						v-for="article in data.blog.articles"
						:key="article.id"
						:title="article.title"
						:desc="article.description"
						:author="article.user_created.first_name + ' ' + article.user_created.last_name"
						:date="getFriendlyDate(article.publish_date)"
						:url="`/blog/${article.id}`"
						:img="`https://marketing.directus.app/assets/${article.image}?key=card`"
					/>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { data } from '../data/blog.data.js';
import { getFriendlyDate } from '../utils/time.js';
import Pattern from './home/Pattern.vue';
import Badge from './Badge.vue';
</script>

<style scoped>
.page {
	padding: 24px;
}
.paddingBox {
	padding: 0 32px;
}

.sectionContainer {
	max-width: calc(var(--vp-layout-max-width) - 64px);
}

.sectionPaddingHero {
	padding-block: 108px;
}

.hero {
	/* background: var(--vp-docs-section-bg);
	color: white; */
	position: relative;
	overflow: hidden;
	border-radius: 12px;
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

.heroContent {
	max-width: 580px;
	position: relative;
}

.heroContent h1 {
	font-size: 60px;
	font-weight: 700;
	line-height: 1;
	margin: 20px 0;
}

.heroContent p {
	max-inline-size: 50ch;
	margin: 20px 0;
}

.heroButtons {
	margin: 48px 0;
}

.heroToggler {
	border-radius: 12px;
	width: 100%;
	max-width: 400px;
	border: 1px solid rgba(255, 255, 255, 0.1);
	box-shadow: 0 0 100px 24px rgba(255, 255, 255, 0.3);
	backdrop-filter: blur(4px);
	margin-left: 20px;
}

.flex {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.grid2 {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 32px;
}

.buttonGroup {
	display: inline-flex;
	gap: 32px;
}

@media only screen and (max-width: 1200px) {
	.heroToggler {
		display: none;
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

	.grid2,
	.grid3 {
		grid-template-columns: 1fr;
	}

	.heroContent h1 {
		font-size: 42px;
	}

	.sectionPaddingHero {
		padding-block: 32px;
	}
}
</style>
