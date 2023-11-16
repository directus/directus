<script setup lang="ts">
import Meta from './Meta.vue';
import { useData } from 'vitepress';
import { marked } from 'marked';

const { page } = useData();
</script>

<template>
	<blockquote>
		<!-- eslint-disable-next-line vue/no-v-html -->
		<p v-if="page.frontmatter['description']" v-html="marked(page.frontmatter['description'])" />
	</blockquote>
	<Meta title-left="Author" title-right="Directus Version">
		<template #left>
			<div class="data">{{ page.frontmatter['author'] }}</div>
		</template>

		<template #right>
			<div class="data">{{ page.frontmatter['directus_version'] }}</div>
		</template>
	</Meta>
</template>

<style scoped>
.data {
	font-weight: 700;
}
</style>
