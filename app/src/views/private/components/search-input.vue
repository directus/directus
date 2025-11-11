<script setup lang="ts">
import { useElementSize } from '@directus/composables';
import { Filter } from '@directus/types';
import { isObject } from 'lodash';
import { Ref, computed, inject, onMounted, ref, watch } from 'vue';

const props = withDefaults(
	defineProps<{
		modelValue: string | null;
		showFilter?: boolean;
		collection?: string;
		filter?: Filter | null;
		autofocus?: boolean;
		placeholder?: string;
	}>(),
	{
		showFilter: true,
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

const mainElement = inject<Ref<Element | undefined>>('main-element');
const filterElement = ref<HTMLElement>();
const { width: mainElementWidth } = useElementSize(mainElement!);
const { width: filterElementWidth } = useElementSize(filterElement);

watch(
	[mainElementWidth, filterElementWidth],
	() => {
		if (!filterElement.value) return;

		const headerElement = mainElement?.value?.firstElementChild;

		if (!headerElement) return;

		const searchElement = filterElement.value.parentElement!;
		const minWidth = searchElement.offsetWidth - 4;

		const maxWidth =
			searchElement.getBoundingClientRect().right -
			(headerElement.getBoundingClientRect().left +
				Number(window.getComputedStyle(headerElement).paddingInlineStart.replace('px', '')));

		filterElement.value.style.maxInlineSize = maxWidth > minWidth ? `${String(maxWidth)}px` : '0px';
	},
	{ immediate: true },
);

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

function emitValue() {
	if (!input.value) return;
	const value = input.value?.value;
	emit('update:modelValue', value);
}
</script>

<template>
	<v-badge bottom right class="search-badge" :value="activeFilterCount" :disabled="!activeFilterCount || filterActive">
		<div
			v-click-outside="{
				handler: disable,
				middleware: onClickOutside,
				disabled: !active,
			}"
			class="search-input"
			:class="{
				active,
				'filter-active': filterActive,
				'has-content': !!modelValue,
				'filter-border': filterBorder,
				'show-filter': showFilter,
			}"
			role="search"
			@click="activate"
		>
			<v-icon
				v-tooltip.bottom="!active ? t('search') : undefined"
				name="search"
				class="icon-search"
				:clickable="!active"
				@click="input?.focus()"
			/>
			<input
				ref="input"
				:value="modelValue"
				:placeholder="placeholder ?? t('search_items')"
				type="search"
				spellcheck="false"
				autocapitalize="off"
				autocorrect="off"
				autocomplete="off"
				:tabindex="!active && !modelValue ? -1 : undefined"
				@input="emitValue"
				@paste="emitValue"
				@keydown.esc="disable"
				@focusin="activate"
				@focusout="filterActive ? undefined : disable()"
			/>
			<div class="spacer" />
			<v-icon
				v-if="modelValue"
				v-tooltip.bottom="$t('clear_value')"
				clickable
				class="icon-clear"
				name="close"
				@click.stop="clear"
			/>
			<template v-if="showFilter">
				<v-icon v-tooltip.bottom="$t('filter')" clickable class="icon-filter" name="filter_list" @click="toggleFilter" />

				<transition-expand @before-enter="filterBorder = true" @after-leave="filterBorder = false">
					<div v-show="filterActive" ref="filterElement" class="filter" :class="{ active }">
						<interface-system-filter
							class="filter-input"
							inline
							:value="filter"
							:collection-name="collection"
							@input="$emit('update:filter', $event)"
						/>
					</div>
				</transition-expand>
			</template>
		</div>
	</v-badge>
</template>

<style lang="scss" scoped>
.search-badge {
	--v-badge-background-color: var(--theme--primary);
	--v-badge-offset-y: 8px;
	--v-badge-offset-x: 8px;
}

.search-input {
	display: flex;
	align-items: center;
	inline-size: 42px;
	min-block-size: 42px;
	max-inline-size: 100%;
	box-sizing: content-box;
	overflow: hidden;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: calc((42px + var(--theme--border-width) * 2) / 2);
	transition:
		inline-size var(--slow) var(--transition),
		border-end-start-radius var(--fast) var(--transition),
		border-end-end-radius var(--fast) var(--transition);

	&.show-filter {
		inline-size: 69px;
	}

	input {
		inline-size: 0;
		block-size: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
		color: var(--theme--foreground);
		text-overflow: ellipsis;
		background-color: var(--theme--form--field--input--background);
		border: none;
		border-radius: 0;
		flex-grow: 1;
		opacity: 0;

		&::placeholder {
			color: var(--theme--foreground-subdued);
		}
	}

	.spacer {
		inline-size: 8px;
	}

	.icon-clear {
		--v-icon-color: var(--theme--foreground-subdued);
		--v-icon-color-hover: var(--theme--danger);

		min-inline-size: auto;
		overflow: hidden;
	}

	.icon-search,
	.icon-filter {
		--v-icon-color-hover: var(--theme--primary);

		&:focus-visible {
			border-radius: 50%;
		}
	}

	.icon-search {
		margin: 0 4px 0 9px; // visually center in closed filter
	}

	.icon-filter {
		margin-inline-end: 8px;
	}

	&:focus-within,
	&:hover {
		border-color: var(--theme--form--field--input--border-color-hover);
	}

	&.has-content {
		inline-size: 200px;

		.icon-clear {
			margin-inline-end: 8px;
		}

		input {
			opacity: 1;
		}

		&.show-filter {
			.icon-clear {
				margin-inline-end: 0;
			}
		}
	}

	&.active {
		inline-size: 300px;
		border-color: var(--theme--form--field--input--border-color-focus);

		input {
			opacity: 1;
		}
	}

	&.filter-active {
		inline-size: 200px;

		.icon-filter {
			--v-icon-color: var(--theme--primary);
		}

		@media (min-width: 600px) {
			inline-size: 250px;
		}

		@media (min-width: 960px) {
			inline-size: 300px;
		}

		@media (min-width: 1260px) {
			inline-size: 420px; /* blaze it */
		}
	}

	&.filter-border {
		padding-block-end: var(--theme--border-width);
		border-block-end: none;
		border-end-end-radius: 0;
		border-end-start-radius: 0;
		transition:
			border-end-start-radius 0s,
			border-end-end-radius 0s;

		&::after {
			position: absolute;
			inset-inline: var(--theme--border-width) var(--theme--border-width);
			inset-block-end: calc(-1 * var(--theme--border-width));
			inline-size: auto;
			block-size: var(--theme--border-width);
			background-color: var(--theme--border-color-subdued);
			content: '';
			pointer-events: none;
		}
	}
}

.filter {
	position: absolute;
	inset-block-start: 100%;
	inset-inline-end: 0;
	inline-size: auto;
	min-inline-size: 100%;
	padding: 0;
	background-color: var(--theme--background-subdued);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-start-end-radius: 0;
	border-end-end-radius: 22px;
	border-end-start-radius: 22px;

	&.active {
		border-color: var(--theme--form--field--input--border-color-focus);
	}

	.filter-input {
		/* Use margin instead of padding to make sure transition expand takes it into account */
		margin: 10px 8px;
	}
}
</style>
