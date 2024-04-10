<script setup>
import routingExceptions from '@/utils/routingExceptions'
import formatTitle from '@directus/format-title'

const route = useRoute()
const pathParts = route.params?.slug.slice(0, -1) || []

const section = formatTitle(pathParts.join(' / '))

const customContentDoc = routingExceptions.find(r => r.path == route.path)
const contentDocPath = customContentDoc ? customContentDoc.file : route.path
const { data } = await useAsyncData('page', () => queryContent(contentDocPath).findOne())

const toc = data.value.body.toc.links.map(link => ({
	_path: `#${link.id}`,
	title: link.text
}))

definePageMeta({
	layout: 'docs'
})
</script>

<template>
	<div class="slug">
		<main>
			<span v-if="section" class="section-title">{{ section }}</span>
			<article>
				<ContentRenderer class="prose" :value="data">
					<template #not-found>
						<h1>Document not found</h1>
					</template>
				</ContentRenderer>
			</article>
			<PrevNext class="prev-next" :path="contentDocPath" />
		</main>
		<aside>
			<div v-if="data.body.toc.links?.length > 0" class="toc">
				<span class="section-title">On This Page</span>
				<nav>
					<NavSectionList :list="toc" :highlight-active="false" />
				</nav>
			</div>
		</aside>
	</div>
</template>

<style lang="scss" scoped>
.slug {
	display: grid;
	grid-template-columns: auto 250px;
	width: 100%;
	gap: 3rem;
}
main {
	margin-top: var(--nav-spacing-under);
	.prev-next {
		padding: var(--nav-spacing-under) 0;
	}
}
aside {
	margin-top: var(--nav-spacing-under);
	padding-left: 2rem;
	border-left: 2px solid var(--border);
}
</style>
