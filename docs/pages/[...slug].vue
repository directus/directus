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
		<article>
			<ContentDoc class="content">
				<template #not-found>
					<h1>Document not found</h1>
				</template>
			</ContentDoc>
		</article>
	</main>
</template>

<style>
article .content > img {
	display: block;
	margin: 1rem 0;
	width: 100%;
	border-radius: 8px;
}
</style>
