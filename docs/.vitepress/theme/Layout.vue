<template>
	<Layout :class="{ isHome }">
		<template #doc-footer-before>
			<Feedback :url="path" :title="title" />
			<Contributors id="contributors" :contributors="contributors" />
		</template>
	</Layout>
</template>

<script setup>
import { useData, useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { computed, watchEffect } from 'vue';
import Feedback from '../components/Feedback.vue';

const { Layout } = DefaultTheme;
const { page, lang } = useData();
const route = useRoute();
const title = computed(() => page.value.title);
const contributors = computed(() => page.value.frontmatter['contributors']);
const path = computed(() => route.path);
const isHome = computed(() => ['/', '/index.html'].includes(path.value));

watchEffect(() => {
	// check if it's a browser
	if (typeof document !== 'undefined') {
		document.cookie = `nf_lang=${lang.value}; expires=Mon, 1 Jan 2030 00:00:00 UTC; path=/`;
	}
});
</script>

<style scoped>
#contributors {
	margin-bottom: 2em;
}
</style>
