<template>
	<v-badge bottom right class="search-badge" :value="activeFilterCount" :disabled="!activeFilterCount">
		<div
			v-click-outside="{
				handler: disable,
				middleware: onClickOutside,
			}"
			class="search-input"
			:class="{ active, 'filter-active': filterActive, 'has-content': !!modelValue }"
			@click="active = true"
		>
			<v-icon v-tooltip.bottom="active ? null : t('search')" clickable name="search" class="icon-search" />
			<input ref="input" :value="modelValue" :placeholder="t('search_items')" @input="emitValue" @paste="emitValue" />
			<v-icon
				v-if="modelValue"
				clickable
				class="icon-empty"
				name="close"
				@click.stop="$emit('update:modelValue', null)"
			/>
			<v-menu
				v-model="filterActive"
				:close-on-content-click="false"
				placement="bottom-end"
				:offset-x="10"
				:offset-y="10"
			>
				<template #activator="{ toggle }">
					<v-icon v-tooltip.bottom="t('filter')" clickable class="icon-filter" name="filter_list" @click="toggle" />
				</template>

				<div class="filter">
					<interface-system-filter
						inline
						:value="filter"
						:collection-name="collection"
						@input="$emit('update:filter', $event)"
					/>
				</div>
			</v-menu>
		</div>
	</v-badge>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, watch, PropType, computed } from 'vue';
import { Filter, LogicalFilterAND } from '@directus/shared/types';

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

		watch(active, (newActive: boolean) => {
			if (newActive === true && input.value !== null) {
				input.value.focus();
			}
		});

		const activeFilterCount = computed(() => {
			if (!props.filter) return 0;

			return (props.filter as LogicalFilterAND)._and?.length ?? 0;
		});

		return { t, active, disable, input, emitValue, onClickOutside, activeFilterCount, filterActive };

		function disable() {
			active.value = false;
		}

		function emitValue() {
			if (!input.value) return;
			const value = input.value?.value;
			emit('update:modelValue', value);
		}

		function onClickOutside(e: { path: HTMLElement[] }) {
			if (e.path.some((el) => el?.classList?.contains('v-menu-content'))) return false;

			return true;
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
	width: 76px;
	height: 44px;
	overflow: hidden;
	border: 2px solid var(--border-normal);
	border-radius: calc(44px / 2);
	cursor: pointer;
	transition: width var(--slow) var(--transition);

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
	}

	.icon-filter {
		margin: 0 8px;
		margin-left: 0;
	}

	&:hover {
		border-color: var(--border-normal-alt);
	}

	&.active {
		width: 360px;
		border-color: var(--primary);
		border-bottom-color: var(--background-page);
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;

		.icon-search {
			--v-icon-color: var(--primary);
		}

		.icon-empty {
			display: block;
		}
	}

	&.filter-active {
		.icon-filter {
			--v-icon-color: var(--primary);
		}
	}

	&.has-content {
		width: 200px;

		&:focus,
		&:focus-within {
			width: 360px;
		}

		.icon-empty {
			display: block;
		}

		.icon-filter {
			margin-left: 0;
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
	min-width: 352px;
	max-width: 420px; // blaze it
	padding: 0;
}
</style>
