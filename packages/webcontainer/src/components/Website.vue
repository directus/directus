<template>
	<div class="website">
		<button @click="fetchArticles()">Refresh</button>
		<div v-for="article in articles" :key="article.id">
			{{ article.title }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
	url: string;
}>();

const articles = ref<Record<string, any>[]>([]);

watch(
	() => props.url,
	async (newURL) => {
		if (newURL === 'loading.html') return;

		fetchArticles();
	}
);

async function fetchArticles() {
	const request = await fetch(`${props.url}/items/articles`, {
		mode: 'no-cors',
	});

	articles.value = await request.json();
	console.log(articles.value);
}
</script>

<style scoped lang="scss">
.terminal {
	width: 100%;
	height: 100%;
}
</style>
