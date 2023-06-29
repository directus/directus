<template>
	<Layout>
		<template #doc-footer-before>
			<ArticleFeedback :url="path" :title="title" />
			<Contributors id="contributors" :contributors="contributors" />
		</template>
	</Layout>
</template>

<script setup>
import { useData, useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { computed } from 'vue';
import ArticleFeedback from '../components/ArticleFeedback.vue';

const { Layout } = DefaultTheme;
const { page } = useData();
const route = useRoute();
const title = computed(() => page.value.title);
const contributors = computed(() => page.value.frontmatter.contributors);
const path = computed(() => route.path);
</script>

<style scoped>
#contributors {
	margin-bottom: 2em;
}
</style>
