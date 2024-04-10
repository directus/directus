<script setup>
import sidebarExclude from '@/utils/sidebarExclude'

const route = useRoute()

const queryBuilder = queryContent().where({ _path: { $not: { $containsAny: sidebarExclude } }})
const { data: navigation } = await useAsyncData('navigation', () => fetchContentNavigation(queryBuilder))
</script>

<template>
	<HeaderHero v-if="route.path == '/'" />
	<HeaderNav />
	<div class="docs container">
		<nav>
			<section v-for="section of navigation" :key="section._path">
				<span class="section-title">{{ section.title }}</span>
				<nav>
					<NavSectionList :list="section.children" />
				</nav>
			</section>
		</nav>
		<slot />
	</div>
</template>

<style lang="scss" scoped>
.docs {
	display: grid;
	grid-template-columns: 200px auto;
	gap: 3rem;
	> nav {
		margin-top: var(--nav-spacing-under);
		border-right: 2px solid var(--border);
		section {
			margin: 2rem 0;
			&:first-child {
				margin-top: 0;
			}
		}
	}
}
</style>
