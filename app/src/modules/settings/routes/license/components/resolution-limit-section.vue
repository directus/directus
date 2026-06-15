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
		/** Returns true for candidates that are shown but can't be selected (e.g. the current admin) */
		disabledFor?: (candidate: TCandidate) => boolean;
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

const expanded = reactive(new Set<string>());

function visibleCandidatesFor(caption: string, candidates: TCandidate[]): TCandidate[] {
	if (expanded.has(caption)) return candidates;
	return candidates.slice(0, props.initialVisible);
}

function hiddenCountFor(candidates: TCandidate[]): number {
	return Math.max(0, candidates.length - props.initialVisible);
}

// Usage that would remain once the selected items are deactivated
const effectiveUsage = computed(() => props.usage - props.modelValue.size);

function isDisabled(candidate: TCandidate): boolean {
	return props.disabledFor?.(candidate) ?? false;
}

function isChecked(candidate: TCandidate): boolean {
	return props.modelValue.has(props.idFor(candidate));
}

function toggle(candidate: TCandidate): void {
	if (isDisabled(candidate)) return;
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
			<span class="usage-counter" :class="effectiveUsage > limit ? 'over' : 'within'">
				<span class="usage-current">{{ effectiveUsage }}</span>
				<span class="usage-total">/ {{ limit }} {{ t('licensing.resolve_available') }}</span>
			</span>
		</header>

		<div v-for="group in groups" :key="group.caption" class="group">
			<p class="caption">{{ group.caption }}</p>

			<div class="grid">
				<div
					v-for="candidate in visibleCandidatesFor(group.caption, group.candidates)"
					:key="idFor(candidate)"
					class="item"
					:class="{ selected: isChecked(candidate), disabled: isDisabled(candidate) }"
				>
					<div
						class="item-toggle"
						role="button"
						:tabindex="isDisabled(candidate) ? -1 : 0"
						:aria-disabled="isDisabled(candidate)"
						@click="toggle(candidate)"
						@keydown.space.prevent="toggle(candidate)"
						@keydown.enter.prevent="toggle(candidate)"
					>
						<VCheckbox
							:model-value="isChecked(candidate)"
							:disabled="isDisabled(candidate)"
							@update:model-value="toggle(candidate)"
						/>
						<span class="item-content">
							<slot name="item" :candidate="candidate">
								<span class="item-label">{{ idFor(candidate) }}</span>
							</slot>
						</span>
					</div>
					<button v-if="linkable" type="button" class="item-link" @click.stop="emit('open-item', candidate)">
						<VIcon name="open_in_new" small />
					</button>
				</div>
			</div>

			<button
				v-if="!expanded.has(group.caption) && hiddenCountFor(group.candidates) > 0"
				type="button"
				class="show-more"
				@click="expanded.add(group.caption)"
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

.usage-counter {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.125rem 0.5rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-subdued);
	font-size: 0.8125rem;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.usage-current {
	color: var(--theme--foreground-accent);
}

.usage-total {
	color: var(--theme--foreground-subdued);
	font-weight: 500;
}

.usage-counter.over {
	background-color: var(--theme--danger-background, var(--theme--danger));
}

.usage-counter.over .usage-current {
	color: var(--theme--danger);
}

.usage-counter.within {
	background-color: var(--theme--success-background, var(--theme--success));
}

.usage-counter.within .usage-current {
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

@media (max-width: 45rem) {
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

.item.disabled {
	opacity: 0.5;
}

.item.disabled .item-toggle {
	cursor: not-allowed;
}

.item.selected :deep(.item-label) {
	color: var(--theme--primary);
}

.item-toggle {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex: 1;
	min-inline-size: 0;
	padding: 0.5rem 0.75rem;
	color: inherit;
	font: inherit;
	text-align: start;
	cursor: pointer;
}

.item-toggle:focus-visible {
	outline: 2px solid var(--theme--primary);
	outline-offset: -2px;
	border-radius: var(--theme--border-radius);
}

.item-content {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-inline-size: 0;
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
