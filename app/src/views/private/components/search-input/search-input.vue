<template>
	<v-badge bottom left class="search-badge" :value="activeFilterCount" :disabled="!activeFilterCount">
		<div
			v-tooltip.bottom="active ? null : t('search')"
			v-click-outside="{
				handler: disable,
				middleware: onClickOutside,
			}"
			class="search-input"
			:class="{ active, 'has-content': !!modelValue }"
			@click="active = true"
		>
			<v-icon name="search" />
			<input ref="input" :value="modelValue" :placeholder="t('search_items')" @input="emitValue" @paste="emitValue" />
			<v-icon v-if="modelValue" class="empty" name="close" @click.stop="emptyAndClose" />
			<v-menu :close-on-content-click="false" placement="bottom-end" :offset-x="10" :offset-y="16" rounded>
				<template #activator="{ toggle }">
					<v-icon class="filter-toggle" name="filter_list" clickable @click="toggle" />
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

		watch(active, (newActive: boolean) => {
			if (newActive === true && input.value !== null) {
				input.value.focus();
			}
		});

		const activeFilterCount = computed(() => {
			if (!props.filter) return 0;

			return (props.filter as LogicalFilterAND)._and?.length ?? 0;
		});

		return { t, active, disable, input, emptyAndClose, emitValue, onClickOutside, activeFilterCount };

		function disable() {
			active.value = false;
		}

		function emptyAndClose() {
			emit('update:modelValue', null);
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
	width: 44px;
	height: 44px;
	overflow: hidden;
	border: 2px solid var(--border-normal);
	border-radius: calc(44px / 2);
	cursor: pointer;
	transition: width var(--slow) var(--transition);

	.empty {
		--v-icon-color: var(--foreground-subdued);

		display: none;

		&:hover {
			--v-icon-color: var(--danger);
		}
	}

	&:hover {
		border-color: var(--border-normal-alt);
	}

	&:focus,
	&:focus-within {
		border-color: var(--primary);
	}

	&.active {
		width: 300px;
		border-color: var(--primary);

		.empty {
			display: block;
		}
	}

	&.has-content {
		width: 140px;

		&:focus,
		&:focus-within {
			width: 300px;
		}

		.empty {
			display: block;
		}
	}
}

input {
	flex-grow: 1;
	width: 0px;
	height: 100%;
	margin: 0;
	padding: 0;
	color: var(--foreground-normal);
	background-color: var(--background-page);
	border: none;
	border-radius: 0;

	&::placeholder {
		color: var(--foreground-subdued);
	}
}

.value {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.v-icon {
	margin: 0 8px;
	cursor: pointer;
}

.filter {
	min-width: 292px;
	max-width: 400px;
	padding: 0;
}
</style>
