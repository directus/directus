<template>
	<v-item-group class="repeater">
		<draggable :value="value" handle=".drag-handle" @input="onSort" :set-data="hideDragImage">
			<repeater-row
				v-for="(row, index) in value"
				:key="index"
				:value="row"
				:template="template"
				:fields="fields"
				@input="updateValues(index, $event)"
				@delete="removeItem(row)"
				:disabled="disabled"
			/>
		</draggable>
		<button @click="addNew" class="add-new" v-if="showAddNew">
			<v-icon name="add" />
			{{ createItemText }}
		</button>
	</v-item-group>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import RepeaterRow from './repeater-row.vue';
import { Field } from '@/types';
import Draggable from 'vuedraggable';
import i18n from '@/lang';
import hideDragImage from '@/utils/hide-drag-image';

export default defineComponent({
	components: { RepeaterRow, Draggable },
	props: {
		value: {
			type: Array,
			default: null,
		},
		fields: {
			type: Array as PropType<Partial<Field>[]>,
			default: () => [],
		},
		template: {
			type: String,
			required: true,
		},
		createItemText: {
			type: String,
			default: i18n.t('add_a_new_item'),
		},
		limit: {
			type: Number,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const showAddNew = computed(() => {
			if (props.disabled) return false;
			if (props.value === null) return true;
			if (props.limit === null) return true;
			if (Array.isArray(props.value) && props.value.length <= props.limit) return true;
			return false;
		});

		return { updateValues, onSort, removeItem, addNew, showAddNew, hideDragImage };

		function updateValues(index: number, updatedValues: any) {
			emit(
				'input',
				props.value.map((item, i) => {
					if (i === index) {
						return updatedValues;
					}

					return item;
				})
			);
		}

		function onSort(sortedItems: any[]) {
			emit('input', sortedItems);
		}

		function removeItem(row: any) {
			if (props.value) {
				emit(
					'input',
					props.value.filter((existingItem) => existingItem !== row)
				);
			} else {
				emit('input', null);
			}
		}

		function addNew() {
			const newDefaults: any = {};

			props.fields.forEach((field) => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				newDefaults[field.field!] = field.schema?.default_value;
			});

			if (props.value !== null) {
				emit('input', [...props.value, newDefaults]);
			} else {
				emit('input', [newDefaults]);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.add-new {
	display: flex;
	align-items: center;
	width: 100%;
	height: 48px;
	margin-top: 8px;
	padding: 10px; // 10 not 12, offset for border
	color: var(--foreground-subdued);
	border: 2px dashed var(--border-normal);
	border-radius: var(--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: color, border-color;

	.v-icon {
		margin-right: 8px;
	}

	&:hover {
		color: var(--primary);
		border-color: var(--primary);
	}
}
</style>
