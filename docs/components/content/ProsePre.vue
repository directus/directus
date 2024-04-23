<script setup lang="ts">
defineProps({
	code: {
		type: String,
		default: ''
	},
	language: {
		type: String,
		default: null
	},
	filename: {
		type: String,
		default: null
	},
	highlights: {
		type: Array as () => number[],
		default: () => []
	},
	meta: {
		type: String,
		default: null
	},
	class: {
		type: String,
		default: null
	}
})
</script>

<template>
	<div class="prose-pre">
		<div v-if="filename" class="filename">{{ filename }}</div>
		<pre :class="$props.class"><slot /></pre>
	</div>
</template>

<style scoped lang="scss">
.filename {
	background: var(--background--subdued);
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);
	padding: 0.5rem 1rem;
	font-family: var(--font--code);
	font-size: 0.8rem;
	border: 1px solid var(--border-2);
	border-bottom: 0;
}
.filename + pre {
	border-top-left-radius: 0;
	border-top-right-radius: 0;
}
pre {
	width: 100%;
	font-weight: normal;
	padding: 0.7rem 1rem;
	border-radius: var(--border-radius);
	background: var(--background--subdued);
	border: 1px solid var(--border-2);
}
</style>

<style>
pre code .line {
	display: block;
	font-size: 0.9rem;
}
</style>
