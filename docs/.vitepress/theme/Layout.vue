<template>
	<Layout>
		<template #doc-footer-before>
			<Feedback :url="path" :title="title" />
			<Meta v-if="contributors" id="contributors" title-left="Contributors">
				<template #left>
					<div class="contributors">{{ contributors }}</div>
				</template>
			</Meta>
		</template>
	</Layout>
</template>

<script setup lang="ts">
import { useData, useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { computed } from 'vue';
import Feedback from '../components/Feedback.vue';

const { Layout } = DefaultTheme;
const { page } = useData();
const route = useRoute();
const title = computed(() => page.value.title);
const contributors = computed(() => page.value.frontmatter['contributors']);
const path = computed(() => route.path);
</script>

<style scoped>
#contributors {
	margin-bottom: 2em;
}

.contributors {
	font-weight: 700;
}
</style>
