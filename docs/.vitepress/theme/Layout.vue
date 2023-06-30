<template>
	<Layout :class="{ isHome: path === '/' }">
		<template #doc-footer-before>
			<Feedback :url="path" :title="title" />
			<Contributors id="contributors" :contributors="contributors" />
		</template>
	</Layout>
</template>

<script setup>
import { useData, useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { computed } from 'vue';
import Feedback from '../components/Feedback.vue';

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
