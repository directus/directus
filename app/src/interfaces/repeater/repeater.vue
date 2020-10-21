<template>
	<v-item-group class="repeater">
		<draggable :value="value" handle=".drag-handle" @input="onSort" :set-data="hideDragImage">
			<repeater-row
				v-for="(row, index) in value"
				:key="index"
				:value="row"
				:template="_template"
				:fields="fields"
				@input="updateValues(index, $event)"
				@delete="removeItem(row)"
				:disabled="disabled"
				:headerPlaceholder="headerPlaceholder"
				:initialActive="addedIndex === index"
			/>
		</draggable>
		<button @click="addNew" class="add-new" v-if="showAddNew">
			<v-icon name="add" />
			{{ addLabel }}
		</button>
	</v-item-group>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import RepeaterRow from './repeater-row.vue';
import { Field } from '@/types';
import Draggable from 'vuedraggable';
import i18n from '@/lang';
import hideDragImage from '@/utils/hide-drag-image';

export default defineComponent({
	components: { RepeaterRow, Draggable },
	props: {
		value: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
		fields: {
			type: Array as PropType<Partial<Field>[]>,
			default: () => [],
		},
		template: {
			type: String,
			default: null,
		},
		addLabel: {
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
		headerPlaceholder: {
			type: String,
			default: i18n.t('empty_item'),
		},
	},
	setup(props, { emit }) {
		const addedIndex = ref<number | null>(null);

		const _template = computed(() => {
			if (props.template === null) return props.fields.length > 0 ? `{{${props.fields[0].field}}}` : '';
			return props.template;
		});

		const showAddNew = computed(() => {
			if (props.disabled) return false;
			if (props.value === null) return true;
			if (props.limit === null) return true;
			if (Array.isArray(props.value) && props.value.length < props.limit) return true;
			return false;
		});

		return { updateValues, onSort, removeItem, addNew, showAddNew, hideDragImage, addedIndex, _template };

		function updateValues(index: number, updatedValues: any) {
			emitValue(
				props.value.map((item: any, i: number) => {
					if (i === index) {
						return updatedValues;
					}

					return item;
				})
			);
		}

		function onSort(sortedItems: any[]) {
			emitValue(sortedItems);
		}

		function removeItem(row: any) {
			addedIndex.value = null;
			if (props.value) {
				emitValue(props.value.filter((existingItem) => existingItem !== row));
			} else {
				emitValue(null);
			}
		}

		function addNew() {
			const newDefaults: any = {};

			props.fields.forEach((field) => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				newDefaults[field.field!] = field.schema?.default_value;
			});

			addedIndex.value = props.value === null ? 0 : props.value.length;

			if (props.value !== null) {
				emitValue([...props.value, newDefaults]);
			} else {
				emitValue([newDefaults]);
			}
		}

		function emitValue(value: null | any[]) {
			if (value === null || value.length === 0) {
				return emit('input', null);
			}

			return emit('input', value);
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
