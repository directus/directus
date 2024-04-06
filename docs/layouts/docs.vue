<script setup>
import sidebarExclude from '@/utils/sidebarExclude'

const queryBuilder = queryContent().where({ _path: { $not: { $containsAny: sidebarExclude } }})
const { data: navigation } = await useAsyncData('navigation', () => fetchContentNavigation(queryBuilder))
</script>

<template>
	<div class="page docs">
		<aside>
			<NuxtLink to="/">Home</NuxtLink>
			<nav>
				<section v-for="section of navigation" :key="section._path">
					<span>{{ section.title }}</span>
					<nav>
						<NavSectionList :list="section.children" />
					</nav>
				</section>
			</nav>
		</aside>
		<main>
			<slot />
		</main>
	</div>
</template>

<style lang="scss">
body, h1, h2, h3 {
	margin: 0;
}
h2, h3, h4 {
	a {
		color: inherit;
		text-decoration: none;
	}
}
</style>

<style lang="scss" scoped>
.page {
	display: grid;
	grid-template-columns: 175px auto;
	gap: 2em;
}
aside {
	background: lightgrey;
	height: 100vh;
	overflow-y: scroll;
	position: sticky;
}
main {
	width: 80ch;
	padding-top: 2rem;
	max-height: 100vh;
	overflow-y: scroll;
}
section {
	margin: 1rem 0;
}
</style>
