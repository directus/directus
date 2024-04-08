<script setup>
defineProps({
	uuid: {
		type: String,
		required: true
	},
	alt: {
		type: String,
		required: true
	},
	width: {
		type: [String, Number],
		default: 1280,
	},
	height: {
		type: [String, Number],
	}
})
</script>

<template>
	<NuxtImg :src="uuid" :alt="alt" :width="width" :height="height" format="auto" loading="lazy" />
</template>
