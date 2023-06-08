<script setup lang="ts">
import { data } from '../data/blog.data.js';
import { getFriendlyDate } from '../utils/time.js';
import { truncateString } from '../utils/strings';
</script>
<template>
	<section class="page">
		<div class="container big-stack">
			<a v-for="article in data.blog.articles" :key="article.id" :href="`/blog/${article.id}`" class="card">
				<div class="image">
					<img :src="`https://marketing.directus.app/assets/${article.image}`" alt="" loading="lazy" />
				</div>
				<div class="heading">
					<h2>{{ article.title }}</h2>
					<p>{{ truncateString(article.summary, 200) }}</p>
					<span class="meta">
						{{ article.user_created.first_name }} {{ article.user_created.last_name }} •
						{{ getFriendlyDate(article.publish_date) }}
					</span>
				</div>
			</a>
		</div>
	</section>
</template>

<style lang="scss" scoped>
.page {
	padding: 1rem;
}

#guides {
	.three-up {
		li {
			a {
				img {
					aspect-ratio: 16/9;
				}
			}
		}
	}
	@media only screen and (max-width: 880px) {
		margin-top: 160px !important;
	}
}

.article-hero {
	display: flex;
	height: auto;
	max-height: none;
	padding-top: 110px;
	.container {
		align-items: stretch;
		// align-items: flex-start;
		.one-up {
			display: flex;
			align-items: flex-end;
			position: relative;
			width: calc(100% - 40px - ((100% - 80px) / 3));
			background-color: white;
			border-radius: '16px';
			overflow: hidden;
			&:hover {
				.content h2 {
					text-decoration: underline;
					text-decoration-color: rgba(white, 0.5);
					text-decoration-thickness: 2px;
					text-underline-offset: 3px;
				}
			}
			.content {
				position: relative;
				padding: 40px;
				z-index: 3;
				&::before {
					content: '';
					position: absolute;
					top: 0;
					left: -15px;
					right: -15px;
					bottom: -30px;
					background-color: gray;
					opacity: 0.5;
					transform: rotate(-4deg);
					z-index: -1;
				}
				span {
					background: white;
					padding: 0.25em 0.75em 0.35em;
					border-radius: 8px;
					font-weight: 600;
				}
				h2 {
					color: white;
					text-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
					line-height: 1.25em;
					margin-top: 20px;
					margin-bottom: 20px;
					transition: text-decoration-color var(--fast) var(--transition);
					text-decoration-color: rgba(white, 0);
					font-weight: 600;
				}
				small {
					color: white;
					text-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
					opacity: 0.8;
				}
			}
			img {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				object-fit: cover;
				z-index: 1;
			}
		}
		.stacked {
			list-style-type: none;
			padding: 0;
			width: calc((100% - 80px) / 3);
			a {
				display: flex;
				align-content: center;
				align-items: center;
				position: relative;
				width: 100%;
				max-width: 600px;
				overflow: hidden;
				padding: 1.5em 0;
				&:not(:first-of-type) {
					border-top: 1px solid gray;
				}
				&:hover {
					h2 {
						text-decoration: underline;
						text-decoration-color: gray;
						text-decoration-thickness: 2px;
						text-underline-offset: 2px;
					}
				}
				h2 {
					font-weight: 600;
					font-size: 1em;
					margin-bottom: 0.5rem;
					line-height: 1.4em;
					transition: text-decoration-color var(--fast) var(--transition);
					text-decoration-color: rgba(gray, 0);
				}
				span.meta {
					color: #7f858d;
				}
			}
		}
	}
	@media only screen and (max-width: 880px) {
		padding-top: 80px;
		.container {
			.one-up {
				width: 100%;
				margin-bottom: 20px;
				.content {
					margin-top: 160px;
				}
			}
			.stacked {
				list-style-type: none;
				padding: 0;
				width: 100%;
				a {
					max-width: none;
					img {
						width: 68px;
						height: 68px;
						min-width: 68px;
						min-height: 68px;
						margin-right: 20px;
					}
				}
			}
		}
	}
}

.three-up {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-start;
	padding: 0;
	margin: 0 auto 0;
	list-style: none;
	width: 100%;
	&.one-row {
		li {
			@media only screen and (max-width: 880px) {
				&:nth-child(n + 3) {
					display: none;
				}
			}
		}
	}
	li {
		width: 100%;
		max-width: calc((100% - 80px) / 3);
		align-items: flex-start;
		margin: 0;
		margin-right: 40px;
		&:nth-child(3n) {
			margin-right: 0;
		}
		a {
			&:hover {
				b {
					text-decoration: underline;
					text-decoration-color: gray;
					text-decoration-thickness: 2px;
					text-underline-offset: 2px;
				}
			}
			img {
				width: 100%;
				height: auto;
				aspect-ratio: 16/9;
				object-fit: cover;
				border-radius: 12px;
				margin-bottom: 10px;
			}
			.bold.primary {
				display: flex;
				margin-top: 0.75em;
				span {
					background: #f0ecff;
					padding: 0.25em 0.75em;
					border-radius: 8px;
					font-weight: 600;
				}
			}
			h2 {
				font-weight: 600;
				font-size: 1.25em;
				margin-top: 1rem;
				margin-bottom: 1rem;
				line-height: 1.4em;
				transition: text-decoration-color var(--fast) var(--transition);
				text-decoration-color: rgba(gray, 0);
			}
			span.meta {
				color: #7f858d;
			}
		}
		@media only screen and (max-width: 1000px) {
			.bold.primary span {
				font-size: 0.75em;
			}
			a h2 {
				font-size: 20px;
			}
		}
		@media only screen and (max-width: 880px) {
			max-width: calc((100% - 40px) / 2);
			&:nth-child(3n) {
				margin-right: 40px;
			}
			&:nth-child(2n) {
				margin-right: 0;
			}
		}
		@media only screen and (max-width: 600px) {
			max-width: 100%;
			margin-right: 0 !important;
			margin-bottom: 40px;

			&:nth-child(n + 3) {
				display: list-item;
			}

			a {
				small.bold {
					font-size: 16px;
					line-height: 23px;
				}
				b {
					font-size: 24px;
					line-height: 24px;
					font-weight: 800;
				}
			}
		}
	}
}

.big-stack a {
	display: flex;
	width: 100%;
	&:not(:first-of-type) {
		margin-top: 40px;
	}
	&:hover {
		.heading h2 {
			text-decoration: underline;
			text-decoration-color: gray;
			text-decoration-thickness: 2px;
			text-underline-offset: 3px;
		}
	}
	.image {
		width: calc((100% - 40px) / 2);
		aspect-ratio: 16/9;
		margin-right: 40px;
		img {
			border-radius: 12px;
			display: block;
			width: 100%;
			object-fit: cover;
		}
	}
	.heading {
		width: calc((100% - 40px) / 2);
		.bold.primary {
			display: flex;
			span {
				background: #f0ecff;
				padding: 0.25em 0.75em;
				border-radius: 8px;
				font-weight: 600;
			}
		}
		h2 {
			transition: text-decoration-color var(--fast) var(--transition);
			text-decoration-color: rgba(gray, 0);
			font-weight: 600;
			font-size: 1.5em;
			margin-top: 1rem;
			margin-bottom: 1rem;
			line-height: 1.4em;
		}
		.summary {
			width: 100%;
			max-width: none;
			display: -webkit-box;
			// max-height: 90px;
			-webkit-line-clamp: 3;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}
		span.meta {
			color: #7f858d;
		}
		button {
			margin-top: 30px;
		}
	}
	@media only screen and (max-width: 1000px) {
		.heading {
			.bold.primary {
				display: flex;
				span {
					font-size: 0.75em;
				}
			}
			h2 {
				font-size: 20px;
				margin-top: 0.75em;
				margin-bottom: 0.75rem;
			}
			.meta {
				font-size: 16px;
			}
		}
	}
	@media only screen and (max-width: 600px) {
		flex-wrap: wrap;
		&:not(:first-of-type) {
			margin-top: 60px;
		}
		.image {
			width: 100%;
			margin-right: 0;
			margin-bottom: 10px;
		}

		.heading {
			width: 100%;
			max-width: none;
			.bold.primary {
				margin-top: 0.25em;
			}
			h2 {
				font-size: 24px;
				margin-top: 0.5em;
				margin-bottom: 0.25em;
			}
		}
	}
}
</style>
