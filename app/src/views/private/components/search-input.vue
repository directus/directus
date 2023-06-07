<template>
	<v-badge bottom right class="search-badge" :value="activeFilterCount" :disabled="!activeFilterCount || filterActive">
		<div
			v-click-outside="{
				handler: disable,
				middleware: onClickOutside,
			}"
			class="search-input"
			:class="{ active, 'filter-active': filterActive, 'has-content': !!modelValue, 'filter-border': filterBorder }"
			@click="active = true"
		>
			<v-icon v-tooltip.bottom="active ? null : t('search')" name="search" class="icon-search" :clickable="!active" />
			<input ref="input" :value="modelValue" :placeholder="t('search_items')" @input="emitValue" @paste="emitValue" />
			<v-icon
				v-if="modelValue"
				clickable
				class="icon-empty"
				name="close"
				@click.stop="$emit('update:modelValue', null)"
			/>

			<v-icon
				v-tooltip.bottom="t('filter')"
				clickable
				class="icon-filter"
				name="filter_list"
				@click="filterActive = !filterActive"
			/>

			<transition-expand @before-enter="filterBorder = true" @after-leave="filterBorder = false">
				<div v-show="filterActive" ref="filterElement" class="filter">
					<interface-system-filter
						class="filter-input"
						inline
						:value="filter"
						:collection-name="collection"
						@input="$emit('update:filter', $event)"
					/>
				</div>
			</transition-expand>
		</div>
	</v-badge>
</template>

<script setup lang="ts">
import { useElementSize } from '@directus/composables';
import { Filter } from '@directus/types';
import { isObject } from 'lodash';
import { Ref, computed, inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	modelValue: string | null;
	collection: string;
	filter?: Filter | null;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: string | null): void;
	(e: 'update:filter', value: Filter | null): void;
}>();

const { t } = useI18n();

const input = ref<HTMLInputElement | null>(null);

const active = ref(props.modelValue !== null);
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

		const searchElement = filterElement.value.parentElement!;
		const minWidth = searchElement.offsetWidth - 4;

		if (filterElementWidth.value > minWidth) {
			filterElement.value.style.borderTopLeftRadius =
				filterElementWidth.value > minWidth + 22 ? 22 + 'px' : filterElementWidth.value - minWidth + 'px';
		} else {
			filterElement.value.style.borderTopLeftRadius = '0px';
		}

		const headerElement = mainElement?.value?.firstElementChild;

		if (!headerElement) return;

		const maxWidth =
			searchElement.getBoundingClientRect().right -
			(headerElement.getBoundingClientRect().left +
				Number(window.getComputedStyle(headerElement).paddingLeft.replace('px', '')));

		filterElement.value.style.maxWidth = maxWidth > minWidth ? `${String(maxWidth)}px` : '0px';
	},
	{ immediate: true }
);

watch(active, (newActive: boolean) => {
	if (newActive === true && input.value !== null) {
		input.value.focus();
	}
});

const activeFilterCount = computed(() => {
	if (!props.filter) return 0;

	let filterOperators: string[] = [];

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

function onClickOutside(e: { path?: HTMLElement[]; composedPath?: () => HTMLElement[] }) {
	const path = e.path || e.composedPath!();
	if (path.some((el) => el?.classList?.contains('v-menu-content'))) return false;

	return true;
}

function disable() {
	active.value = false;
	filterActive.value = false;
}

function emitValue() {
	if (!input.value) return;
	const value = input.value?.value;
	emit('update:modelValue', value);
}
</script>

<style lang="scss" scoped>
.search-badge {
	--v-badge-background-color: var(--primary);
	--v-badge-offset-y: 8px;
	--v-badge-offset-x: 8px;
}

.search-input {
	display: flex;
	align-items: center;
	width: 72px;
	max-width: 100%;
	height: 44px;
	overflow: hidden;
	border: 2px solid var(--border-normal);
	border-radius: calc(44px / 2);
	transition: width var(--slow) var(--transition), border-bottom-left-radius var(--fast) var(--transition),
		border-bottom-right-radius var(--fast) var(--transition);

	.icon-empty {
		--v-icon-color: var(--foreground-subdued);

		display: none;
		margin-left: 8px;

		&:hover {
			--v-icon-color: var(--danger);
		}
	}

	.icon-search,
	.icon-filter {
		--v-icon-color-hover: var(--primary);
	}

	.icon-search {
		margin: 0 8px;
		margin-right: 4px;
	}

	.icon-filter {
		margin: 0 8px;
		margin-left: 0;
	}

	&:hover {
		border-color: var(--border-normal-alt);
	}

	&.has-content {
		width: 200px;

		.icon-empty {
			display: block;
		}

		.icon-filter {
			margin-left: 0;
		}
	}

	&.active {
		width: 300px;
		border-color: var(--border-normal);

		.icon-empty {
			display: block;
		}
	}

	&.filter-active {
		width: 200px;

		.icon-filter {
			--v-icon-color: var(--primary);
		}

		@media (min-width: 600px) {
			width: 250px;
		}

		@media (min-width: 960px) {
			width: 300px;
		}

		@media (min-width: 1260px) {
			width: 420px; /* blaze it */
		}
	}

	&.filter-border {
		padding-bottom: 2px;
		border-bottom: none;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
		transition: border-bottom-left-radius none, border-bottom-right-radius none;

		&::after {
			position: absolute;
			right: 2px;
			bottom: -2px;
			left: 2px;
			width: auto;
			height: 2px;
			background-color: var(--border-subdued);
			content: '';
			pointer-events: none;
		}
	}

	input {
		flex-grow: 1;
		width: 0px;
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
		color: var(--foreground-normal);
		text-overflow: ellipsis;
		background-color: var(--background-page);
		border: none;
		border-radius: 0;

		&::placeholder {
			color: var(--foreground-subdued);
		}
	}
}

.value {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.filter {
	position: absolute;
	top: 100%;
	right: 0;
	width: auto;
	min-width: 100%;
	padding: 0;
	background-color: var(--background-subdued);
	border: 2px solid var(--border-normal);
	border-bottom-right-radius: 22px;
	border-bottom-left-radius: 22px;
}

.filter-input {
	/* Use margin instead of padding to make sure transition expand takes it into account */
	margin: 10px 8px;
}
</style>
