<script setup>
import routingExceptions from '@/utils/routingExceptions'
import formatTitle from '@directus/format-title'

const route = useRoute()
const section = route.params?.slug?.[0] ? formatTitle(route.params.slug[0]) : false

const customContentDoc = routingExceptions.find(r => r.path == route.path)

definePageMeta({
	layout: 'docs'
})
</script>

<template>
	<main>
		<span v-if="section">{{ section }}</span>
		<article>
			<ContentDoc class="content" :path="customContentDoc?.file">
				<template #not-found>
					<h1>Document not found</h1>
				</template>
			</ContentDoc>
		</article>
	</main>
</template>
