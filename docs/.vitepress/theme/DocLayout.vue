<script setup>
import { computed } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { useData, useRoute } from 'vitepress';
import ArticleFeedback from '../components/ArticleFeedback.vue';

const { Layout } = DefaultTheme;
const { page } = useData();
const route = useRoute();
const title = computed(() => page.value.title);
const contributors = computed(() => page.value.frontmatter.contributors);
const path = computed(() => route.path);
</script>

<template>
	<Layout>
		<template #doc-footer-before>
			<ArticleFeedback :url="path" :title="title" />
			<Contributors id="contributors" :contributors="contributors" />
		</template>
	</Layout>
</template>

<style scoped>
#contributors {
	margin-bottom: 2em;
}
</style>