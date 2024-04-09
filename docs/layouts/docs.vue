<script setup>
import sidebarExclude from '@/utils/sidebarExclude'

const route = useRoute()

const queryBuilder = queryContent().where({ _path: { $not: { $containsAny: sidebarExclude } }})
const { data: navigation } = await useAsyncData('navigation', () => fetchContentNavigation(queryBuilder))
</script>

<template>
	<HeaderHero v-if="route.path == '/'" />
	<HeaderNav />
	<div class="page container">
		<aside>
			<nav>
				<section v-for="section of navigation" :key="section._path">
					<span>{{ section.title }}</span>
					<nav>
						<NavSectionList :list="section.children" />
					</nav>
				</section>
			</nav>
		</aside>
		<main class="prose">
			<slot />
		</main>
	</div>
</template>

<style lang="scss" scoped>
.page {
	display: grid;
	grid-template-columns: 200px auto;
	gap: 2em;
}
aside {
	margin-top: 2rem;
	border-right: 2px solid var(--border);
}
main {
	width: 80ch;
	padding-top: 2rem;
	padding-bottom: 2rem;
}
section {
	margin: 2rem 0;
	&:first-child {
		margin-top: 0;
	}
	& span {
		color: var(--typography--subdued);
		text-transform: uppercase;
		font-size: var(--nav-font);
		font-weight: 500;
	}
}
</style>
