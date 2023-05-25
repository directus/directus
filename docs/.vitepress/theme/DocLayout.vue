<script setup>
import { computed } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { useData, useRoute } from 'vitepress';
import ArticleFeedback from '../components/ArticleFeedback.vue';

const { Layout } = DefaultTheme;
const { page } = useData();
const route = useRoute();
const title = computed(() => page.value.title);
const path = computed(() => route.path);
</script>

<template>
	<Layout>
		<template #doc-footer-before>
			<ArticleFeedback :url="path" :title="title" />
		</template>
	</Layout>
</template>
