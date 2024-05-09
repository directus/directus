<script setup>
defineProps({
	type: {
		type: String,
		required: true,
		validator(value) {
			return ['youtube'].includes(value)
		}
	},
	id: {
		type: String,
		required: true
	},
})
</script>

<template>
	<div class="video">
		<iframe :src="`https://www.youtube.com/embed/${id}`" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
	</div>
</template>

<style>
iframe {
	width: 100%;
	aspect-ratio: 16 / 9;
	border-radius: var(--border-radius);
}
</style>
