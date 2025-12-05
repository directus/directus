<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type { Change } from '@/composables/use-comparison-diff';
import { reconstructComparisonHtml } from '@/utils/reconstruct-comparison-html';

const props = defineProps<{
	changes: Change[];
	side: 'base' | 'incoming';
	updated?: boolean;
}>();

const { t } = useI18n();

const changesFiltered = computed(() => {
	return props.changes.filter((change: Change) => {
		if (props.updated) return true;

		if (props.side === 'incoming') {
			return change.removed !== true;
		}

		return change.added !== true;
	});
});

const isCompleteReplacement = computed(() => {
	return props.changes.length === 2;
});

const isAdded = computed(() => props.side === 'incoming');
const isDeleted = computed(() => props.side === 'base');

const diffHtml = computed(() => {
	return reconstructComparisonHtml(props.changes, props.side, props.updated);
});
</script>

<template>
	<div
		class="comparison-diff"
		:class="{ added: isAdded, deleted: isDeleted, updated, 'no-highlight': isCompleteReplacement }"
	>
		<div class="delta">
			<template v-if="diffHtml">
				<!-- sanitized in use-comparison-diff.ts-->
				<!-- eslint-disable-next-line vue/no-v-html -->
				<div v-html="diffHtml" />
			</template>
			<template v-else>
				<span v-for="(part, index) in changesFiltered" :key="index" :class="{ changed: part.added || part.removed }">
					<template v-if="part.updated">{{ t('revision_delta_update_message') }}</template>
					<template v-else-if="part.value !== null && part.value !== undefined">
						{{ part.value }}
					</template>
					<template v-else>
						<span class="no-value">{{ t('no_value') }}</span>
					</template>
				</span>
			</template>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.comparison-diff {
	inline-size: 100%;
	padding: 0;

	.changed {
		position: relative;
		margin-inline-end: 0.2em;
		padding: 2px;
		border-radius: var(--theme--border-radius);
	}

	&.added .changed {
		background-color: var(--success-25);
	}

	&.deleted .changed {
		background-color: var(--danger-25);
	}

	&.updated .changed {
		background-color: var(--warning-25);
	}
}

.no-value {
	font-style: italic;
	opacity: 0.25;
}

.no-highlight .changed {
	background-color: transparent;
}

:deep(.diff-added) {
	background-color: var(--success-25);
	padding: 2px;
	border-radius: var(--theme--border-radius);
	margin-inline-end: 0.2em;
}

:deep(.diff-removed) {
	background-color: var(--danger-25);
	padding: 2px;
	border-radius: var(--theme--border-radius);
	margin-inline-end: 0.2em;
}
</style>
