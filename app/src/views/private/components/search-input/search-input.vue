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
			<input
				ref="input"
				:value="modelValue"
				:placeholder="t('search_items')"
				@input="emitValueDebounced"
				@paste="emitValueDebounced"
			/>
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

			<transition-expand @beforeEnter="filterBorder = true" @afterLeave="filterBorder = false">
				<div v-show="filterActive" class="filter">
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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, watch, PropType, computed } from 'vue';
import { Filter } from '@directus/shared/types';
import { debounce, isObject } from 'lodash';

export default defineComponent({
	props: {
		modelValue: {
			type: String,
			default: null,
		},
		collection: {
			type: String,
			required: true,
		},
		filter: {
			type: Object as PropType<Filter>,
			default: null,
		},
	},
	emits: ['update:modelValue', 'update:filter'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const input = ref<HTMLInputElement | null>(null);

		const active = ref(props.modelValue !== null);
		const filterActive = ref(false);
		const filterBorder = ref(false);

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

		const emitValueDebounced = debounce(() => emitValue(), 250);

		return {
			t,
			active,
			disable,
			input,
			emitValueDebounced,
			activeFilterCount,
			filterActive,
			onClickOutside,
			filterBorder,
		};

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
	},
});
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
		width: 420px; // blaze it

		.icon-filter {
			--v-icon-color: var(--primary);
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
			bottom: 0px;
			left: 0;
			z-index: -1;
			width: 100%;
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
	left: 0;
	width: 100%;
	padding: 0;
	background-color: var(--background-subdued);
	border: 2px solid var(--border-normal);
	border-top: 0;
	border-bottom-right-radius: 22px;
	border-bottom-left-radius: 22px;
}

.filter-input {
	// Use margin instead of padding to make sure transition expand takes it into account
	margin: 10px 8px;
}
</style>
