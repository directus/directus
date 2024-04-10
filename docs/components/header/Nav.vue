<script setup>
const nav = ref([
	{
		label: 'Developer Docs',
		href: '/',
		color: 'var(--section--dev-docs)',
		active: true
	},
	{
		label: 'API Reference',
		href: '/api-reference',
		color: 'var(--section--api-reference)',
	},
	{
		label: 'Tutorials',
		href: '/tutorials',
		color: 'var(--section--tutorials)',
	},
	{
		label: 'User Guide',
		href: '/user-guide',
		color: 'var(--section--user-guide)',
	},
	{
		label: 'Community',
		href: '/community',
		color: 'var(--section--community)',
	},
	{
		label: 'Directus TV',
		href: 'https://directus.io/tv',
		external: true
	},
	{
		label: 'Starter Kits',
		href: 'https://directus.io/plus',
		external: true
	},
])
</script>

<template>
	<nav>
		<ul class="container">
			<li v-for="item in nav" :key="item.label">
				<a :href="item.href" :class="{ active: item.active }" :style="`--active-color: ${item.color}`">
					{{ item.label }}
				</a>
			</li>
		</ul>
	</nav>
</template>

<style scoped>
nav {
	background: var(--background--subdued);
	border: 2px solid var(--border);
}
ul {
	list-style-type: none;
	display: flex;
	font-size: var(--nav-font);
	gap: 2rem;
}
a {
	text-decoration: none;
	padding: var(--nav-padding) 0;
	display: inline-block;
	border-bottom: 2px solid transparent;
	font-weight: 500;
	margin-bottom: -2px;
	&:hover, &.active {
		color: var(--active-color);
		border-color: var(--active-color);
	}
}
</style>
