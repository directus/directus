<script setup>
const route = useRoute()
const { data: pages } = await useAsyncData('home', () => queryContent(route.fullPath).find())
</script>

<template>
	<div>
		<p>Pages in this section...</p>
		<ol>
			<li v-for="link of pages.slice(1)" :key="link._path">
				<NuxtLink :to="link._path">
					<span>{{ link.title }}</span>
				</NuxtLink>
			</li>
		</ol>
	</div>
</template>
