<script setup>
import routingExceptions from '@/utils/routingExceptions'

const props = defineProps({
	path: {
		type: String,
		required: true
	}
})

const { data: surround } = await useAsyncData('prevNext', () => queryContent().only(['_path', 'title']).findSurround(props.path))

const [prev, next] = surround.value.map(link => {
	if(!link) return null
	const exception = routingExceptions.find(r => r.file == link._path)
	return exception ? { ...link, _path: exception.path } : link
})
</script>

<template>
	<div>
		<NuxtLink v-if="prev" :to="prev._path">
			<span class="section-title">Previous Page</span>
			<p>{{ prev.title }}</p>
		</NuxtLink>
		<div v-else></div>
		<!-- <NuxtLink v-if="next" :to="next._path">
			<Badge :text="`Next: ${next.title}`" />
		</NuxtLink> -->
		<NuxtLink v-if="next" :to="next._path">
			<span class="section-title">Next Page</span>
			<p>{{ next.title }}</p>
		</NuxtLink>
		<div v-else></div>
	</div>
</template>

<style scoped>
div {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	a {
		text-decoration: none;
		border: 1px solid var(--border-2);
		border-radius: var(--border-radius);
		padding: 0.5rem 1rem 0.65rem;
		&:last-child {
			text-align: right;
		}
		&:hover {
			border: 1px solid var(--border-3);
		}
		p {
			font-weight: bold;
		}
	}
}
</style>
