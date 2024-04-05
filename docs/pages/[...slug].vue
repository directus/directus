<script setup>
import formatTitle from '@directus/format-title'

const route = useRoute()

definePageMeta({
	layout: 'docs'
})
</script>

<template>
	<main>
		<span>{{ formatTitle(route.params.slug[0]) }}</span>
		<ContentDoc>
			<template #not-found>
				<h1>Document not found</h1>
			</template>
		</ContentDoc>
	</main>
</template>
