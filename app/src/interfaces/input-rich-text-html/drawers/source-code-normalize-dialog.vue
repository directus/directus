<script setup lang="ts">
import type { Change } from 'diff';
import { computed } from 'vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VNotice from '@/components/v-notice.vue';

const props = defineProps<{ diff: Change[] }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const open = defineModel<boolean>({ required: true });

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
	<VDialog v-model="open" @esc="emit('cancel')" @apply="emit('confirm')">
		<VCard class="normalize-dialog">
			<VCardTitle>{{ $t('wysiwyg_options.source_code_normalize_title') }}</VCardTitle>

			<div class="content">
				<VNotice type="warning" class="notice">{{ $t('wysiwyg_options.source_code_normalize_body') }}</VNotice>

				<div class="diff">
					<span v-for="(line, index) in lines" :key="index" class="line" :class="`line--${line.type}`">
						{{ line.text || ' ' }}
					</span>
				</div>
			</div>

			<VCardActions>
				<VButton secondary @click="emit('cancel')">{{ $t('cancel') }}</VButton>
				<VButton kind="warning" @click="emit('confirm')">{{ $t('wysiwyg_options.save_anyway') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style lang="scss" scoped>
.normalize-dialog {
	--v-card-min-width: auto;

	inline-size: min(52rem, calc(100vw - 7rem));
	max-inline-size: none;
}

.content {
	padding: 0 var(--content-padding);
}

.notice {
	margin-block-end: 1rem;
}

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
