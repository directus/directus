<script setup lang="ts">

defineProps<{
	text: string;
	state: 'streaming' | 'done';
}>();
</script>

<template>
	<div v-md="text || ''" class="message-text" :data-state="state"></div>
</template>

<style lang="scss" scoped>
.message-text {
	:deep(p) {
		margin: 0.5rem 0;

		&:first-child {
			margin-top: 0;
		}

		&:last-child {
			margin-bottom: 0;
		}
	}

	:deep(pre) {
		margin: 0.5rem 0;
		padding: 1rem;
		background-color: var(--theme--background);
		border-radius: var(--theme--border-radius);
		overflow-x: auto;

		code {
			background-color: transparent;
			padding: 0;
		}
	}

	:deep(code) {
		background-color: var(--theme--background);
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-family: var(--theme--fonts--monospace--font-family);
		font-size: 0.875em;
	}

	:deep(ul),
	:deep(ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	:deep(li) {
		margin: 0.25rem 0;
	}

	:deep(a) {
		color: var(--theme--primary);
		text-decoration: underline;

		&:hover {
			text-decoration: none;
		}
	}
}
</style>
