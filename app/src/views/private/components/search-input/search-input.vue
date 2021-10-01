<template>
	<div
		v-tooltip.bottom="active ? null : t('search')"
		class="search-input"
		:class="{ active, 'has-content': !!modelValue }"
		@click="active = true"
	>
		<v-icon name="search" />
		<input ref="input" :value="modelValue" :placeholder="t('search_items')" @input="emitValue" @paste="emitValue" />
		<v-icon v-if="modelValue" class="empty" name="close" @click.stop="emptyAndClose" />
		<v-menu :close-on-content-click="false" show-arrow placement="bottom-end" :offset="16">
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
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, watch, PropType } from 'vue';
import { Filter } from '@directus/shared/types';

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

		return { t, active, disable, input, emptyAndClose, emitValue };

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
	},
});
</script>

<style lang="scss" scoped>
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
	min-width: 280px;
	max-width: 600px;
	padding: 0;
}
</style>
