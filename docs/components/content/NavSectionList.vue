<script setup>
defineProps({
	list: Object
})
</script>

<template>
	<ol>
		<li v-for="link of list" :key="link._path">
			<NuxtLink :to="link._path">{{ link.title }}</NuxtLink>
			<NavSectionList v-if="link.children" :list="link.children.slice(1)" />
		</li>
	</ol>
</template>

<style scoped>
ol {
	padding-left: 0;
	list-style-type: none;
	margin: 0;
}
ol ol {
	padding-left: 1rem;
}
a {
	display: block;
	text-decoration: none;
	margin-top: 0.5rem;
}
a.router-link-active {
	/* TODO: USE SECTION COLORS */
	color: var(--primary);
	font-weight: 500;
	border-right: 2px solid var(--primary);
	margin-right: -2px;
}
</style>
