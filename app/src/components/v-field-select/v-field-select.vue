<template>
	<v-notice v-if="!availableFields || availableFields.length === 0">
		{{ $t('no_fields_in_collection', { collection: (collectionInfo && collectionInfo.name) || collection }) }}
	</v-notice>

	<draggable
		v-else
		:force-fallback="true"
		v-model="selectedFields"
		draggable=".draggable"
		:set-data="hideDragImage"
		class="v-field-select"
	>
		<v-chip
			v-for="(field, index) in selectedFields"
			:key="index"
			class="field draggable"
			v-tooltip="field.field"
			@click="removeField(field.field)"
		>
			{{ field.name }}
		</v-chip>

		<template #footer>
			<v-menu show-arrow v-model="menuActive" class="add" placement="bottom">
				<template #activator="{ toggle }">
					<v-button @click="toggle" small>
						{{ $t('add_field') }}
						<v-icon small name="add" />
					</v-button>
				</template>

				<v-list>
					<field-list-item
						v-for="field in availableFields"
						:key="field.key"
						:field="field"
						:depth="depth"
						@add="addField"
					/>
				</v-list>
			</v-menu>
		</template>
	</draggable>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, PropType, computed } from '@vue/composition-api';
import FieldListItem from '../v-field-template/field-list-item.vue';
import { useFieldsStore } from '@/stores';
import { Field, Collection, Relation } from '@/types';
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
		inject: {
			type: Object as PropType<{ fields: Field[]; collections: Collection[]; relations: Relation[] } | null>,
			default: () => ({ fields: [], collections: [], relations: [] }),
		},
	},
	setup(props, { emit }) {
		const menuActive = ref(false);
		const { collection, inject } = toRefs(props);

		const { info } = useCollection(collection);
		const { tree } = useFieldTree(collection, false, inject);

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
				return _value.value.map((field) => ({
					field,
					name: findTree(tree.value, field.split('.'))?.name as string,
				}));
			},
			set(newVal: { field: string; name: string }[]) {
				_value.value = newVal.map((field) => field.field);
			},
		});

		const availableFields = computed(() => {
			return parseTree(tree.value);
		});

		return {
			menuActive,
			addField,
			removeField,
			availableFields,
			selectedFields,
			hideDragImage,
			tree,
			collectionInfo: info,
		};

		function findTree(tree: FieldTree[] | undefined, fieldSections: string[]): FieldTree | undefined {
			if (tree === undefined) return undefined;

			const fieldObject = tree.find((f) => f.field === fieldSections[0]);

			if (fieldObject === undefined) return undefined;
			if (fieldSections.length === 1) return fieldObject;
			return findTree(fieldObject.children, fieldSections.slice(1));
		}

		function parseTree(tree: FieldTree[] | undefined, prefix = '') {
			if (tree === undefined) return undefined;

			const newTree: FieldTree[] = tree.map((field) => {
				return {
					name: field.name,
					field: field.field,
					key: field.key,
					disabled: _value.value.includes(prefix + field.field),
					children: parseTree(field.children, prefix + field.field + '.'),
				};
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
