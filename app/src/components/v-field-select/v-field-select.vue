<template>
	<draggable v-model="activeFields" draggable=".draggable" :set-data="hideDragImage" class="v-field-select">
		<v-chip
			v-for="(field, index) in activeFields"
			:key="index"
			class="field draggable"
			@click.stop="removeField(field.field)"
		>
			{{ field.name }}
		</v-chip>
		<v-menu
			showArrow
			v-model="menuActive"
			v-show="selectableFields.length > 0"
			slot="footer"
			class="add"
			placement="bottom-end"
		>
			<template #activator="{ toggle }">
				<v-chip @click="toggle">
					<v-icon name="add" />
				</v-chip>
			</template>

			<v-list dense>
				<field-list-item @add="addField" v-for="field in selectableFields" :key="field.field" :field="field" />
			</v-list>
		</v-menu>
	</draggable>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, watch, onMounted, onUnmounted, PropType, computed } from '@vue/composition-api';
import FieldListItem from './field-list-item.vue';
import { useFieldsStore } from '@/stores';
import { Field } from '@/types/';
import Draggable from 'vuedraggable';
import useFieldTree from '@/composables/use-field-tree';
import useCollection from '@/composables/use-collection';
import { FieldTree } from '../v-field-template/types';
import hideDragImage from '@/utils/hide-drag-image';

export default defineComponent({
	components: { FieldListItem, Draggable },
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Array as PropType<string[]>,
			default: null,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();

		const menuActive = ref(false);

		const { collection } = toRefs(props);
		const { tree } = useFieldTree(collection);
		const { info, primaryKeyField, fields: fieldsInCollection, sortField } = useCollection(collection);

		const _value = computed({
			get() {
				return props.value || [];
			},
			set(newVal: string[]) {
				emit('input', newVal);
			},
		});

		const treeFlattened = computed(() => {
			const fields: FieldTree[] = [];
			const stack: FieldTree[] = tree.value;

			while (stack.length > 0) {
				const field = stack.shift();
				if (field === undefined) continue;
				fields.push(field);
				if (field.children === undefined) continue;
				stack.push(...field.children);
			}
			return fields;
		});

		const activeFields = computed({
			get() {
				const list = _value.value.map((field) => fieldsInCollection.value.find((f) => f.field === field));
				const filteredList: Field[] = [];
				list.forEach((field) => {
					if (field !== undefined) filteredList.push(field);
				});

				return filteredList;
			},
			set(newVal: Field[]) {
				_value.value = newVal.map((field) => field.field);
			},
		});

		const selectableFields = computed(() => {
			return fieldsInCollection.value.filter((field) => _value.value.includes(field.field) === false);
		});

		return { tree, menuActive, addField, activeFields, removeField, selectableFields, hideDragImage };

		function removeField(field: string) {
			_value.value = _value.value.filter((f) => f !== field);
		}

		function addField(field: string) {
			const newArray = _value.value;
			newArray.push(field);
			_value.value = newArray;
		}
	},
});
</script>

<style lang="scss" scoped>
.v-field-select {
	display: flex;
	flex-wrap: wrap;
}

.v-chip.field {
	margin-right: 5px;

	&:hover {
		background-color: var(--danger);
		border-color: var(--danger);
	}
}
</style>
