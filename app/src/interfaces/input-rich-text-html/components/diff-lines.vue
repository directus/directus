<script setup lang="ts">
import type { Change } from 'diff';
import { computed } from 'vue';

const props = defineProps<{ diff: Change[] }>();

type DiffLine = { type: 'added' | 'removed' | 'context'; text: string };

const lines = computed<DiffLine[]>(() => {
	const result: DiffLine[] = [];

	for (const change of props.diff) {
		let type: DiffLine['type'] = 'context';
		if (change.added) type = 'added';
		else if (change.removed) type = 'removed';

		const parts = change.value.split('\n');
		// diffLines values end in a trailing newline → drop the empty tail it produces
		if (parts.at(-1) === '') parts.pop();
		for (const text of parts) result.push({ type, text });
	}

	return result;
});
</script>

<template>
	<div class="diff">
		<span v-for="(line, index) in lines" :key="index" class="line" :class="`line--${line.type}`">
			{{ line.text || ' ' }}
		</span>
	</div>
</template>

<style lang="scss" scoped>
.diff {
	overflow: auto;
	max-block-size: 50vh;
	padding: 0.5rem;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 0.8125rem;
	line-height: 1.6;
}

.line {
	display: block;
	white-space: pre-wrap;
	padding-inline: 0.25rem;
}

.line--added {
	color: var(--theme--success);
	background-color: var(--theme--success-background);
}

.line--removed {
	color: var(--theme--danger);
	background-color: var(--theme--danger-background);
}
</style>
