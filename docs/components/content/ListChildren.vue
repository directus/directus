<script setup>
const route = useRoute()
const { data: pages } = await useAsyncData('home', () => queryContent(route.fullPath).find())
</script>

<template>
	<div>
		<Callout v-for="link of pages.slice(1)" :key="link._path" type="link" :url="link._path">
			{{ link.title }}
		</Callout>
	</div>
</template>
