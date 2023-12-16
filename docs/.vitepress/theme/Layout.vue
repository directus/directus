<script setup lang="ts">
import { useData, useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { computed } from 'vue';
import Feedback from '../components/Feedback.vue';
import Newsletter from '../components/Newsletter.vue';

const { Layout } = DefaultTheme;
const { page } = useData();
const route = useRoute();
const title = computed(() => page.value.title);
const contributors = computed(() => page.value.frontmatter['contributors']);
const path = computed(() => route.path);
const isPackagePage = RegExp('^/packages/.+$').test(path.value);
</script>

<template>
	<Layout>
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

<style scoped>
.newsletter {
	margin-top: 2em;
}

#contributors {
	margin-bottom: 2em;
}

.contributors {
	font-weight: 700;
}
</style>
