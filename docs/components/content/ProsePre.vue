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
// console.log(props.code)
</script>

<template>
	<div class="prose-pre">
		<div v-if="filename" class="filename">{{ filename }}</div>
		<div class="pre-container">
			<pre :class="$props.class"><slot /></pre>
		</div>
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
.filename + .pre-container pre {
	border-top-left-radius: 0;
	border-top-right-radius: 0;
}
.pre-container {
	overflow-x: scroll;
}
</style>

<style>
pre code .line {
	display: block;
}
</style>
