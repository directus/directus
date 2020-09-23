<template>
	<draggable v-model="selectedFields" draggable=".draggable" :set-data="hideDragImage" class="v-field-select">
		<v-chip
			v-for="(field, index) in selectedFields"
			:key="index"
			class="field draggable"
			v-tooltip="field.field"
			@click.stop="removeField(field.field)"
		>
			{{ field.name }}
		</v-chip>
		<v-menu
			show-arrow
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
				<field-list-item
					@add="addField"
					v-for="field in selectableFields"
					:key="field.field"
					:field="field"
					:depth="depth"
				/>
			</v-list>
		</v-menu>
	</draggable>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, watch, onMounted, onUnmounted, PropType, computed } from '@vue/composition-api';
import FieldListItem from '../v-field-template/field-list-item.vue';
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
		depth: {
			type: Number,
			default: 1,
		},
	},
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();

		const menuActive = ref(false);
		const { collection } = toRefs(props);

		const { info, primaryKeyField, fields: fieldsInCollection, sortField } = useCollection(collection);
		const { tree } = useFieldTree(collection, true);

		const _value = computed({
			get() {
				return props.value || [];
			},
			set(newVal: string[]) {
				emit('input', newVal);
			},
		});

		const selectedFields = computed({
			get() {
				return props.value.map((field) => ({
					field,
					name: findTree(tree.value, field.split('.'))?.name as string,
				}));
			},
			set(newVal: { field: string; name: string }[]) {
				_value.value = newVal.map((field) => field.field);
			},
		});

		const selectableFields = computed(() => {
			return filterTree(tree.value, (field, prefix) => props.value.includes(prefix + field.field) === false);
		});

		return { menuActive, addField, removeField, selectableFields, selectedFields, hideDragImage, tree };

		function findTree(tree: FieldTree[] | undefined, fieldSections: string[]): FieldTree | undefined {
			if (tree === undefined) return undefined;

			const fieldObject = tree.find((f) => f.field === fieldSections[0]);

			if (fieldObject === undefined) return undefined;
			if (fieldSections.length === 1) return fieldObject;
			return findTree(fieldObject.children, fieldSections.slice(1));
		}

		function filterTree(
			tree: FieldTree[] | undefined,
			f: (field: FieldTree, prefix: string) => boolean,
			prefix = ''
		) {
			if (tree === undefined) return undefined;

			const newTree: FieldTree[] = [];
			tree.forEach((field) => {
				if (f(field, prefix)) {
					newTree.push({
						field: field.field,
						name: field.name,
						children: filterTree(field.children, f, prefix + field.field + '.'),
					});
				}
			});
			return newTree.length === 0 ? undefined : newTree;
		}

		function removeField(field: string) {
			_value.value = _value.value.filter((f) => f !== field);
		}

		function addField(field: string) {
			const newArray = _value.value;
			newArray.push(field);
			_value.value = [...new Set(newArray)];
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
