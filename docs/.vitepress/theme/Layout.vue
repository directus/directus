<script setup lang="ts">
import { useData, useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { computed } from 'vue';
import Feedback from '../components/Feedback.vue';
import Newsletter from '../components/Newsletter.vue';
import Cloud from '../components/Cloud.vue';

const { Layout } = DefaultTheme;
const { page } = useData();
const route = useRoute();
const title = computed(() => page.value.title);
const contributors = computed(() => page.value.frontmatter['contributors']);
const path = computed(() => route.path);

const isUserPage = computed(() => RegExp('^/user-guide/.*$').test(path.value));
const isDevPage = computed(() => !isUserPage.value);
const isPackagePage = computed(() => RegExp('^/packages/.+$').test(path.value));
</script>

<template>
	<Layout>
		<template #sidebar-nav-before>
			<div class="sidebar-nav-before">
				<div class="toggle">
					<a href="/" :class="{ active: isDevPage }">Developers</a>
					<a href="/user-guide/overview/data-studio-app" :class="{ active: isUserPage }">User Guide</a>
				</div>
			</div>
		</template>
		<template #doc-before>
			<div v-if="isPackagePage" class="warning custom-block" style="padding-bottom: 16px; margin-bottom: 16px">
				<p>
					This is an auto-generated document to support extension builders understand the internal packages they can
					utilize. To find our written guides, tutorials, and API/SDK reference, check out our
					<a href="/">main docs</a>
					.
				</p>
			</div>
		</template>
		<template #aside-outline-after>
			<Newsletter class="newsletter" />
			<Cloud class="cloud" />
		</template>
		<template #doc-footer-before>
			<Feedback v-if="!isPackagePage" :url="path" :title="title" />
			<Meta v-if="contributors" id="contributors" title-left="Contributors">
				<template #left>
					<div class="contributors">{{ contributors }}</div>
				</template>
			</Meta>
		</template>
	</Layout>
</template>

<style lang="scss" scoped>
.sidebar-nav-before {
	padding: 1em 0;
	border-bottom: 1px solid var(--vp-c-divider);

	.toggle {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;

		a {
			display: block;
			text-align: center;
			font-size: 12px;
			padding: 0.25rem;
			font-weight: bold;
			border-radius: 10rem;
			border: 1px solid var(--vp-c-text-3);
			color: var(--vp-c-text-2);

			&:hover {
				color: var(--vp-c-text-1);
				border-color: var(--vp-c-text-2);
			}

			&.active {
				background: var(--vp-c-brand-darkest);
				color: white;
				border-color: transparent;
			}
		}
	}
}

.newsletter,
.cloud {
	margin-top: 2em;
}

#contributors {
	margin-bottom: 2em;
}

.contributors {
	font-weight: 700;
}
</style>
