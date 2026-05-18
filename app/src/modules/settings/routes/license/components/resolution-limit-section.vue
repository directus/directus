<script setup lang="ts" generic="TCandidate">
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import VCheckbox from '@/components/v-checkbox.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

type Group = {
	/** Caption rendered above this group's grid (e.g. "Select user seat(s) to deactivate") */
	caption: string;
	/** Candidates rendered in this group */
	candidates: TCandidate[];
};

const props = withDefaults(
	defineProps<{
		/** Material icon name shown next to the section title */
		icon: string;
		/** Section title shown in the header (e.g. "User Seats") */
		title: string;
		/** Current usage as reported by the license backend */
		usage: number;
		/** Plan limit as reported by the license backend */
		limit: number;
		/** One or more captioned groups of candidates rendered under the section */
		groups: Group[];
		/** Set of selected candidate identifiers (v-model) — selections are shared across groups */
		modelValue: Set<string>;
		/** Returns the unique identifier for a candidate (used for selection state) */
		idFor: (candidate: TCandidate) => string;
		/** When true, each card shows a launch icon that emits `open-item` on click */
		linkable?: boolean;
		/** Number of candidates rendered per group before the "Show more" toggle expands the rest */
		initialVisible?: number;
	}>(),
	{
		initialVisible: 8,
		linkable: false,
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: Set<string>];
	'open-item': [candidate: TCandidate];
}>();

const { t } = useI18n();

const expanded = reactive(new Set<number>());

function visibleCandidatesFor(index: number, candidates: TCandidate[]): TCandidate[] {
	if (expanded.has(index)) return candidates;
	return candidates.slice(0, props.initialVisible);
}

function hiddenCountFor(candidates: TCandidate[]): number {
	return Math.max(0, candidates.length - props.initialVisible);
}

const requiredCount = computed(() => Math.max(0, props.usage - props.limit - props.modelValue.size));

const isSatisfied = computed(() => requiredCount.value === 0);

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
			<span v-if="isSatisfied" class="badge satisfied">
				{{ t('licensing.resolve_all_set') }}
			</span>
			<span v-else class="badge required">
				{{ t('licensing.resolve_select_n_items', { count: requiredCount }, requiredCount) }}
			</span>
		</header>

		<div v-for="(group, index) in groups" :key="index" class="group">
			<p class="caption">{{ group.caption }}</p>

			<div class="grid">
				<div
					v-for="candidate in visibleCandidatesFor(index, group.candidates)"
					:key="idFor(candidate)"
					class="item"
					:class="{ selected: isChecked(candidate) }"
				>
					<button type="button" class="item-toggle" @click="toggle(candidate)">
						<VCheckbox :checked="isChecked(candidate)" />
						<span class="item-content">
							<slot name="item" :candidate="candidate">
								<span class="item-label">{{ idFor(candidate) }}</span>
							</slot>
						</span>
					</button>
					<button v-if="linkable" type="button" class="item-link" @click.stop="emit('open-item', candidate)">
						<VIcon name="launch" small />
					</button>
				</div>
			</div>

			<button
				v-if="!expanded.has(index) && hiddenCountFor(group.candidates) > 0"
				type="button"
				class="show-more"
				@click="expanded.add(index)"
			>
				{{ t('licensing.resolve_show_n_more', { count: hiddenCountFor(group.candidates) }) }}
			</button>
		</div>
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
	font-size: 0.75rem;
	font-weight: 600;
	line-height: 1.4;
}

.badge.required {
	background-color: var(--theme--danger-background, var(--theme--danger));
	color: var(--theme--danger);
}

.badge.satisfied {
	background-color: var(--theme--success-background, var(--theme--success));
	color: var(--theme--success);
}

.group + .group {
	margin-block-start: 1.5rem;
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
	gap: 0.25rem;
	padding-inline-end: 0.5rem;
	border: 1px solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background: var(--theme--form--field--input--background);
	color: var(--theme--foreground);
	transition: border-color var(--fast) var(--transition);
}

.item:hover {
	border-color: var(--theme--form--field--input--border-color-hover);
}

.item.selected {
	border-color: var(--theme--primary);
}

.item.selected :deep(.item-label) {
	color: var(--theme--primary);
}

.item-toggle {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex: 1;
	min-width: 0;
	padding: 0.5rem 0.75rem;
	border: none;
	background: none;
	color: inherit;
	font: inherit;
	text-align: start;
	cursor: pointer;
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

.item-link {
	display: inline-flex;
	align-items: center;
	padding: 0;
	border: none;
	background: none;
	color: var(--theme--foreground-subdued);
	cursor: pointer;
	transition: color var(--fast) var(--transition);
}

.item-link:hover {
	color: var(--theme--foreground);
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
