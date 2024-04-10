<script setup>
import routingExceptions from '@/utils/routingExceptions'

const props = defineProps({
	path: {
		type: String,
		required: true
	}
})

const { data: surround } = await useAsyncData('prevNext', () => queryContent().only(['_path', 'title']).findSurround(props.path))
// const [prev, next] = surround.value

const [prev, next] = surround.value.map(link => {
	if(!link) return null
	const exception = routingExceptions.find(r => r.file == link._path)
	return exception ? { ...link, _path: exception.path } : link
})

console.log({prev, next})
</script>

<template>
	<div>
		<NuxtLink v-if="prev" :to="prev._path">
			<Badge :text="`Previous: ${prev.title}`" />
		</NuxtLink>
		<div v-else></div>
		<NuxtLink v-if="next" :to="next._path">
			<Badge :text="`Next: ${next.title}`" />
		</NuxtLink>
		<div v-else></div>
	</div>
</template>

<style scoped>
div {
	display: flex;
	justify-content: space-between;
	a {
		text-decoration: none;
	}
}
</style>
