<script setup lang="ts">
import { Filter } from '@directus/types';
import { isObject } from 'lodash';
import { computed, onMounted, ref } from 'vue';
import TransitionExpand from '@/components/transition/expand.vue';
import VBadge from '@/components/v-badge.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import InterfaceSystemFilter from '@/interfaces/_system/system-filter/system-filter.vue';

const props = withDefaults(
	defineProps<{
		modelValue: string | null;
		disabled?: boolean;
		showFilter?: boolean;
		expanded?: boolean;
		collection?: string;
		filter?: Filter | null;
		autofocus?: boolean;
		placeholder?: string;
	}>(),
	{
		showFilter: true,
		expanded: false,
	},
);

const emit = defineEmits<{
	(e: 'update:modelValue', value: string | null): void;
	(e: 'update:filter', value: Filter | null): void;
}>();

const input = ref<HTMLInputElement | null>(null);

const active = ref(props.autofocus);
const filterActive = ref(false);
const filterBorder = ref(false);

onMounted(() => {
	if (active.value) input.value?.focus();
});

const activeFilterCount = computed(() => {
	if (!props.filter) return 0;

	const filterOperators: string[] = [];

	parseLevel(props.filter);

	return filterOperators.length;

	function parseLevel(level: Record<string, any>) {
		for (const [key, value] of Object.entries(level)) {
			if (key === '_and' || key === '_or') {
				value.forEach(parseLevel);
			} else if (key.startsWith('_')) {
				filterOperators.push(key);
			} else {
				if (isObject(value)) {
					parseLevel(value);
				}
			}
		}
	}
});

function onClickOutside(event: { path?: HTMLElement[]; composedPath?: () => HTMLElement[] }) {
	const path = event.path || event.composedPath!();
	if (path.some((element) => element?.classList?.contains('v-menu-content'))) return false;
	return true;
}

function activate() {
	if (!active.value) input.value?.focus();
	active.value = true;
}

function toggleFilter() {
	filterActive.value = !filterActive.value;
	active.value = true;
	if (!filterActive.value) input.value?.focus();
}

function clear() {
	emit('update:modelValue', null);
	if (active.value) input.value?.focus();
}

function disable() {
	active.value = false;
	filterActive.value = false;
	input.value?.blur();
}

function onFocusOut(event: FocusEvent) {
	// Check if focus is moving to another element inside the search component -- prevents race condition on touch vs click events
	const searchElement = (event.currentTarget as HTMLElement)?.closest('.search-input');
	const relatedTarget = event.relatedTarget as HTMLElement | null;

	if (relatedTarget?.closest('.v-menu-content')) return;

	if (relatedTarget && searchElement?.contains(relatedTarget)) return;

	if (filterActive.value && !relatedTarget) return;

	disable();
}

function emitValue() {
	if (!input.value) return;
	const value = input.value.value.trim();
	emit('update:modelValue', value || null);
}
</script>

<template>
	<div class="search-input-wrapper">
		<div
			v-click-outside="{
				handler: disable,
				middleware: onClickOutside,
				disabled: !active,
			}"
			class="search-input"
			:class="{
				active,
				expanded,
				disabled,
				'filter-active': filterActive,
				'has-content': !!modelValue,
				'filter-border': filterBorder,
				'show-filter': showFilter,
			}"
			role="search"
			@click="activate"
			@focusout="onFocusOut"
		>
			<VIcon name="search" class="icon-search" :disabled :clickable="!active" @click="input?.focus()" />

			<input
				ref="input"
				class="search-input-field"
				:value="modelValue"
				:placeholder="placeholder ?? $t('search_items')"
				type="search"
				spellcheck="false"
				autocapitalize="off"
				autocorrect="off"
				autocomplete="off"
				:tabindex="!active && !modelValue ? -1 : undefined"
				:disabled
				@input="emitValue"
				@paste="emitValue"
				@keydown.esc="disable"
				@focusin="activate"
			/>

			<div class="spacer" />

			<VIcon
				v-if="modelValue"
				v-tooltip.bottom="$t('clear_value')"
				clickable
				class="icon-clear"
				name="close"
				:disabled
				@click.stop="clear"
			/>

			<template v-if="showFilter">
				<VBadge
					bottom
					right
					class="search-badge"
					:value="activeFilterCount"
					:disabled="disabled || !activeFilterCount || filterActive"
				>
					<VIcon
						v-tooltip.bottom="!disabled && $t('filter')"
						clickable
						class="icon-filter"
						name="filter_list"
						:disabled
						@click="toggleFilter"
					/>
				</VBadge>

				<TransitionExpand @before-enter="filterBorder = true" @after-leave="filterBorder = false">
					<div v-show="filterActive" class="filter" :class="{ active }">
						<InterfaceSystemFilter
							class="filter-input"
							inline
							:value="filter"
							:collection-name="collection"
							@input="$emit('update:filter', $event)"
						/>
					</div>
				</TransitionExpand>
			</template>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

/* Lets .search-input expand when filter is active (.filter-active) without stretching the parent flex layout */
.search-input-wrapper {
	display: flex;
	flex: 1 1 var(--form-column-width);
	min-inline-size: 0;
}

.search-input {
	--button-size: 2rem;
	--search-input-border-width: var(--theme--border-width);
	--search-input-size: calc(var(--button-size) - var(--search-input-border-width) * 2);
	--search-input-radius: var(--theme--border-radius);
	--icon-size: var(--icon-size-default);
	--icon-search-padding-left: 0.375rem; // visually center in closed filter
	--icon-search-padding-right: 0.25rem;
	--icon-filter-margin-right: 0.4375rem;

	position: relative;
	box-sizing: content-box;
	display: flex;
	align-items: center;
	inline-size: var(--search-input-size);
	min-block-size: var(--search-input-size);
	border: var(--search-input-border-width) solid transparent;
	border-radius: var(--search-input-radius);
	transition:
		inline-size var(--slow) var(--transition),
		border-color var(--fast) var(--transition),
		border-end-start-radius var(--fast) var(--transition),
		border-end-end-radius var(--fast) var(--transition);

	&.show-filter {
		/* stylelint-disable scss/operator-no-newline-after */
		inline-size: calc(
			var(--icon-size) * 2 + var(--icon-search-padding-left) + var(--icon-search-padding-right) +
				var(--icon-filter-margin-right)
		);
		/* stylelint-enable scss/operator-no-newline-after */
	}

	/* Show focus ring only when the text input is focused */
	&:has(.search-input-field:focus-visible) {
		outline: var(--focus-ring-width) solid var(--theme--primary);
		outline-offset: var(--focus-ring-offset-invert);
	}

	&.active:not(.expanded),
	&.has-content:not(.expanded) {
		inline-size: var(--form-column-width);
		max-inline-size: 100%;
	}

	.search-input-field {
		inline-size: 0;
		block-size: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
		color: var(--theme--foreground);
		text-overflow: ellipsis;
		background-color: transparent;
		border: none;
		border-radius: 0;
		flex-grow: 1;
		opacity: 0;

		&::placeholder {
			color: var(--theme--foreground-subdued);
		}
	}

	&.disabled .search-input-field {
		color: var(--theme--foreground-subdued);
	}

	.spacer {
		inline-size: 0.4375rem;
	}

	.icon-clear {
		--v-icon-color: var(--theme--foreground-subdued);
		--v-icon-color-hover: var(--theme--danger);

		min-inline-size: auto;
		overflow: hidden;
	}

	.icon-search,
	.icon-filter {
		--v-icon-color-hover: var(--theme--foreground-accent);
	}

	&.disabled {
		.icon-search,
		.icon-filter {
			--v-icon-color: var(--theme--foreground-subdued);
		}
	}

	.icon-search {
		margin-block: 0;
		margin-inline: var(--icon-search-padding-left) var(--icon-search-padding-right);
	}

	.icon-filter {
		margin-inline-end: var(--icon-filter-margin-right);
	}

	&:not(.disabled):not(.active):not(.expanded):not(.has-content):hover {
		background-color: var(--theme--background-accent);
	}

	&.has-content {
		border-color: var(--theme--form--field--input--border-color);
		background-color: var(--theme--form--field--input--background);

		&:not(.disabled):not(.active):not(:focus-within):hover {
			border-color: var(--theme--form--field--input--border-color-hover);
			background-color: var(--theme--form--field--input--background);
		}

		.icon-clear {
			margin-inline-end: 0.4375rem;
		}

		.search-input-field {
			opacity: 1;
		}

		&.show-filter {
			.icon-clear {
				margin-inline-end: 0;
			}
		}
	}

	&.active,
	&.expanded {
		border-color: var(--theme--form--field--input--focus-ring-color);
		background-color: var(--theme--form--field--input--background);

		.search-input-field {
			opacity: 1;
		}
	}

	&.expanded {
		inline-size: 100%;

		&:not(.active) {
			border-color: var(--theme--border-color);
		}
	}

	&.filter-active {
		min-inline-size: var(--form-column-min-width);
		z-index: 10;

		.icon-filter {
			--v-icon-color: var(--theme--primary);
		}
	}

	&.filter-border {
		padding-block-end: var(--search-input-border-width);
		border-block-end: none;
		border-end-end-radius: 0;
		border-end-start-radius: 0;
		transition:
			border-end-start-radius 0s,
			border-end-end-radius 0s;

		&::after {
			position: absolute;
			inset-inline: var(--search-input-border-width);
			inset-block-end: calc(-1 * var(--search-input-border-width));
			inline-size: auto;
			block-size: var(--search-input-border-width);
			background-color: var(--theme--border-color-subdued);
			content: '';
			pointer-events: none;
		}
	}
}

.filter {
	position: absolute;
	inset-block-start: 100%;
	inset-inline-start: calc(-1 * var(--search-input-border-width));
	inline-size: calc(100% + var(--search-input-border-width) * 2);
	padding: 0;
	background-color: var(--theme--background-subdued);
	border: var(--search-input-border-width) solid var(--theme--form--field--input--border-color);
	border-block-start: none;
	border-start-end-radius: 0;
	border-end-end-radius: var(--search-input-radius);
	border-end-start-radius: var(--search-input-radius);
	z-index: 10;

	&::before {
		content: '';
		display: block;
		border-block-start: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	}

	&.active {
		border-color: var(--theme--form--field--input--focus-ring-color);
	}

	.filter-input {
		/* Use margin instead of padding to make sure transition expand takes it into account */
		margin: 0.5625rem 0.4375rem;
	}
}

.search-badge {
	--v-badge-background-color: var(--theme--primary);
	--v-badge-offset-y: 0.125rem;
	--v-badge-offset-x: 0.4375rem;

	:deep(.badge) {
		pointer-events: none;
	}
}
</style>
