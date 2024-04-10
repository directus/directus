<script setup>
const props = defineProps({
	toc: {
		type: Array,
		required: true
	}
})

const list = props.toc.links.map(link => ({
	_path: `#${link.id}`,
	title: link.text
}))
</script>

<template>
	<div class="toc">
		<span class="section-title">On This Page</span>
		<nav>
			<NavSectionList :list="list" :highlight-active="false" />
		</nav>
	</div>
</template>
