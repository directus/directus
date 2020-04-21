<template>
	<div class="cards-header">
		<div class="start">
			<div class="selected" v-if="_selection.length > 0">
				<v-icon name="close" @click="_selection = []" />
				{{ $tc('n_items_selected', _selection.length) }}
			</div>
		</div>
		<div class="end">
			<v-menu show-arrow placement="bottom">
				<template #activator="{ toggle }">
					<div class="sort-selector" @click="toggle">
						{{ sortField && sortField.name }}
					</div>
				</template>

				<v-list dense>
					<v-list-item
						v-for="field in fieldsWithoutFake"
						:key="field.field"
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
				@click="toggleDescending"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Field } from '@/stores/fields/types';
import useSync from '@/compositions/use-sync';

export default defineComponent({
	props: {
		fields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		sort: {
			type: String,
			required: true,
		},
		selection: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			type: Array as PropType<Record<string, any>>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const _sort = useSync(props, 'sort', emit);
		const _selection = useSync(props, 'selection', emit);
		const descending = computed(() => props.sort.startsWith('-'));

		const sortKey = computed(() =>
			props.sort.startsWith('-') ? props.sort.substring(1) : props.sort
		);

		const sortField = computed(() => {
			return props.fields.find((field) => field.field === sortKey.value);
		});

		const fieldsWithoutFake = computed(() =>
			props.fields.filter((field) => field.field.startsWith('$') === false)
		);

		return {
			descending,
			toggleDescending,
			sortField,
			_sort,
			_selection,
			sortKey,
			fieldsWithoutFake,
		};

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
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 52px;
	margin-bottom: 36px;
	padding: 0 8px;
	background-color: var(--background-page);
	border-top: 2px solid var(--border-subdued);
	border-bottom: 2px solid var(--border-subdued);
	box-shadow: 0 0 0 2px var(--background-page);
}

.end {
	display: flex;
	align-items: center;
	color: var(--foreground-subdued);

	.sort-selector {
		margin-right: 8px;
	}

	.sort-selector:hover {
		color: var(--foreground-normal);
		cursor: pointer;
	}

	.sort-direction.descending {
		transform: scaleY(-1);
	}

	.sort-direction:hover {
		--v-icon-color: var(--foreground-normal);

		cursor: pointer;
	}
}
</style>
