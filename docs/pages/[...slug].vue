<script setup>
import routingExceptions from '@/utils/routingExceptions'
import formatTitle from '@directus/format-title'

const route = useRoute()
const needsRedirect = routingExceptions.find(r => r.file == route.path)
if(needsRedirect) await navigateTo(needsRedirect.path)

const pathParts = route.params?.slug.slice(0, -1) || []
const section = formatTitle(pathParts.join(' / '))

const customContentDoc = routingExceptions.find(r => r.path == route.path)
const contentDocPath = customContentDoc ? customContentDoc.file : route.path

const { data } = await useAsyncData('page', () => queryContent(contentDocPath).findOne())
const toc = data?.value?.body?.toc

definePageMeta({
	layout: 'docs'
})
</script>

<template>
	<div class="slug">
		<main>
			<article>
				<ContentRenderer :value="data">
					<span v-if="section" class="section-title">{{ section }}</span>
					<ContentRendererMarkdown class="prose" :value="data" />
					<template #empty>
						<p>No content found.</p>
					</template>
				</ContentRenderer>
			</article>
			<PrevNext class="prev-next" :path="contentDocPath" />
		</main>
		<aside>
			<AsideTableOfContents v-if="data?.body?.toc?.links?.length > 0" :toc="toc" />
			<AsideFeedback />
			<AsideNewsletter />
		</aside>
	</div>
</template>

<style lang="scss" scoped>
.slug {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 250px;
	width: 100%;
	gap: 3rem;
}
main {
	margin-top: var(--nav-spacing-under);
	.prev-next {
		padding: var(--nav-spacing-under) 0 calc(var(--nav-spacing-under) + 1rem);
	}
}
aside {
	margin-top: var(--nav-spacing-under);
	padding-left: 2rem;
	padding-right: 1em;
	border-left: 2px solid var(--border);
	display: flex;
	flex-direction: column;
	gap: calc(var(--nav-spacing-under) / 2);
	> * {
		width: 100%;
	}
}
</style>
