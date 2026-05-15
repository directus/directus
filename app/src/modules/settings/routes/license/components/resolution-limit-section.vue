<script setup lang="ts" generic="TCandidate">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import VCheckbox from '@/components/v-checkbox.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = withDefaults(
	defineProps<{
		/** Material icon name shown next to the section title */
		icon: string;
		/** Section title shown in the header (e.g. "Data Collections") */
		title: string;
		/** Caption rendered above the grid (e.g. "Select collection(s) to deactivate") */
		description: string;
		/** Current usage as reported by the license backend */
		usage: number;
		/** Plan limit as reported by the license backend */
		limit: number;
		/** Candidates returned by the backend — generic over candidate shape */
		candidates: TCandidate[];
		/** Set of selected candidate identifiers (v-model) */
		modelValue: Set<string>;
		/** Returns the unique identifier for a candidate (used for selection state) */
		idFor: (candidate: TCandidate) => string;
		/** Number of candidates rendered before the "Show more" toggle expands the rest */
		initialVisible?: number;
	}>(),
	{
		initialVisible: 8,
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: Set<string>];
}>();

const { t } = useI18n();

const expanded = ref(false);

const visibleCandidates = computed(() => {
	if (expanded.value) return props.candidates;
	return props.candidates.slice(0, props.initialVisible);
});

const hiddenCount = computed(() => Math.max(0, props.candidates.length - props.initialVisible));

const requiredCount = computed(() => Math.max(0, props.usage - props.limit - props.modelValue.size));

function isChecked(candidate: TCandidate): boolean {
	return props.modelValue.has(props.idFor(candidate));
}

function toggle(candidate: TCandidate): void {
	const id = props.idFor(candidate);
	const next = new Set(props.modelValue);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	emit('update:modelValue', next);
}
</script>

<template>
	<section class="resolution-limit-section">
		<header class="section-header">
			<span class="section-title">
				<VIcon :name="icon" small />
				{{ title }}
			</span>
			<span v-if="requiredCount > 0" class="badge">
				{{ t('licensing.resolve_select_n_items', { count: requiredCount }, requiredCount) }}
			</span>
		</header>

		<p class="caption">{{ description }}</p>

		<div class="grid">
			<button
				v-for="candidate in visibleCandidates"
				:key="idFor(candidate)"
				type="button"
				class="item"
				:class="{ selected: isChecked(candidate) }"
				@click="toggle(candidate)"
			>
				<VCheckbox :checked="isChecked(candidate)" />
				<span class="item-content">
					<slot name="item" :candidate="candidate">
						<span class="item-label">{{ idFor(candidate) }}</span>
					</slot>
				</span>
			</button>
		</div>

		<button v-if="!expanded && hiddenCount > 0" type="button" class="show-more" @click="expanded = true">
			{{ t('licensing.resolve_show_n_more', { count: hiddenCount }) }}
		</button>
	</section>
</template>

<style scoped>
.resolution-limit-section {
	margin-block-start: 2rem;
}

.section-header {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-block-end: 0.5rem;
	padding-block-end: 0.75rem;
	border-block-end: 1px solid var(--theme--border-color-subdued);
}

.section-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: var(--theme--foreground-accent);
}

.badge {
	display: inline-flex;
	align-items: center;
	padding: 0.125rem 0.5rem;
	border-radius: 999px;
	background-color: var(--theme--danger-background, var(--theme--danger));
	color: var(--theme--danger);
	font-size: 0.75rem;
	font-weight: 600;
	line-height: 1.4;
}

.caption {
	color: var(--theme--foreground-subdued);
	margin-block-end: 0.75rem;
}

.grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 0.5rem;
}

@media (max-width: 800px) {
	.grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	border: 1px solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background: var(--theme--form--field--input--background);
	color: var(--theme--foreground);
	font: inherit;
	text-align: start;
	cursor: pointer;
	transition: border-color var(--fast) var(--transition);
}

.item:hover {
	border-color: var(--theme--form--field--input--border-color-hover);
}

.item.selected {
	border-color: var(--theme--primary);
}

.item-content {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-width: 0;
	flex: 1;
}

.item-label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.show-more {
	display: inline-flex;
	align-items: center;
	margin-block-start: 0.75rem;
	padding: 0;
	border: none;
	background: none;
	color: var(--theme--primary);
	font: inherit;
	cursor: pointer;
}

.show-more:hover {
	text-decoration: underline;
}
</style>
