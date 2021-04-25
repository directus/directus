<template>
	<div class="cards-header">
		<div class="start">
			<div class="selected" v-if="_selection.length > 0" @click="_selection = []">
				<v-icon name="cancel" outline />
				<span class="label">{{ $tc('n_items_selected', _selection.length) }}</span>
			</div>
			<button class="select-all" v-else @click="$emit('select-all')">
				<v-icon name="check_circle" outline />
				<span class="label">{{ $t('select_all') }}</span>
			</button>
		</div>
		<div class="end">
			<v-icon class="size-selector" :name="`grid_${7 - size}`" v-tooltip.top="$t('card_size')" @click="toggleSize" />

			<v-menu show-arrow placement="bottom">
				<template #activator="{ toggle }">
					<div class="sort-selector" v-tooltip.top="$t('sort_field')" @click="toggle">
						{{ sortField && sortField.name }}
					</div>
				</template>

				<v-list>
					<v-list-item
						v-for="field in fieldsWithoutFake"
						:key="field.field"
						:disabled="field.disabled"
						:active="field.field === sortKey"
						@click="_sort = field.field"
					>
						<v-list-item-content>{{ field.name }}</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
			<v-icon
				class="sort-direction"
				:class="{ descending }"
				name="sort"
				v-tooltip.top="$t('sort_direction')"
				@click="toggleDescending"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Field } from '@/types';
import useSync from '@/composables/use-sync';

export default defineComponent({
	props: {
		fields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		size: {
			type: Number,
			required: true,
		},
		sort: {
			type: String,
			required: true,
		},
		selection: {
			type: Array as PropType<Record<string, any>>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const _size = useSync(props, 'size', emit);
		const _sort = useSync(props, 'sort', emit);
		const _selection = useSync(props, 'selection', emit);
		const descending = computed(() => props.sort.startsWith('-'));

		const sortKey = computed(() => (props.sort.startsWith('-') ? props.sort.substring(1) : props.sort));

		const sortField = computed(() => {
			return props.fields.find((field) => field.field === sortKey.value);
		});

		const fieldsWithoutFake = computed(() => {
			return props.fields
				.filter((field) => field.field.startsWith('$') === false)
				.map((field) => ({
					field: field.field,
					name: field.name,
					disabled: ['json', 'o2m', 'm2o', 'm2a', 'file', 'files', 'alias', 'presentation'].includes(field.type),
				}));
		});

		return {
			toggleSize,
			descending,
			toggleDescending,
			sortField,
			_size,
			_sort,
			_selection,
			sortKey,
			fieldsWithoutFake,
		};

		function toggleSize() {
			if (props.size >= 2 && props.size < 5) {
				_size.value++;
			} else {
				_size.value = 2;
			}
		}

		function toggleDescending() {
			if (descending.value === true) {
				_sort.value = _sort.value.substring(1);
			} else {
				_sort.value = '-' + _sort.value;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.cards-header {
	position: sticky;
	top: var(--layout-offset-top);
	z-index: 4;
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	height: 52px;
	margin-bottom: 36px;
	padding: 0 8px;
	background-color: var(--background-page);
	border-top: 2px solid var(--border-subdued);
	border-bottom: 2px solid var(--border-subdued);
	box-shadow: 0 0 0 2px var(--background-page);
}

.start {
	.label {
		display: inline-block;
		margin-left: 4px;
		transform: translateY(1px);
	}

	.select-all {
		color: var(--foreground-subdued);
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--foreground-normal);
		}
	}

	.selected {
		cursor: pointer;
	}
}

.end {
	display: flex;
	align-items: center;
	color: var(--foreground-subdued);

	.size-selector {
		margin-right: 16px;
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--foreground-normal);
		}
	}

	.sort-selector {
		margin-right: 8px;
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--foreground-normal);
			cursor: pointer;
		}
	}

	.sort-direction {
		transition: color var(--fast) var(--transition);
		&.descending {
			transform: scaleY(-1);
		}

		&:hover {
			--v-icon-color: var(--foreground-normal);

			cursor: pointer;
		}
	}
}
</style>
