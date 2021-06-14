<template>
	<v-notice v-if="!availableFields || availableFields.length === 0">
		{{ t('no_fields_in_collection', { collection: (collectionInfo && collectionInfo.name) || collection }) }}
	</v-notice>

	<draggable
		v-else
		:force-fallback="true"
		v-model="selectedFields"
		item-key="field"
		draggable=".draggable"
		:set-data="hideDragImage"
		class="v-field-select"
	>
		<template #item="{ element }">
			<v-chip class="field draggable" v-tooltip="element.field" @click="removeField(element.field)">
				{{ element.name }}
			</v-chip>
		</template>

		<template #footer>
			<v-menu show-arrow v-model="menuActive" class="add" placement="bottom">
				<template #activator="{ toggle }">
					<v-button @click="toggle" small>
						{{ t('add_field') }}
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
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs, ref, PropType, computed } from 'vue';
import FieldListItem from '../v-field-template/field-list-item.vue';
import { Field, Collection, Relation } from '@/types';
import Draggable from 'vuedraggable';
import useFieldTree from '@/composables/use-field-tree';
import useCollection from '@/composables/use-collection';
import { FieldTree } from '../v-field-template/types';
import hideDragImage from '@/utils/hide-drag-image';

export default defineComponent({
	emits: ['update:modelValue'],
	components: { FieldListItem, Draggable },
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		modelValue: {
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
		const { t } = useI18n();

		const menuActive = ref(false);
		const { collection, inject } = toRefs(props);

		const { info } = useCollection(collection);
		const { tree } = useFieldTree(collection, false, inject);

		const internalValue = computed({
			get() {
				return props.modelValue || [];
			},
			set(newVal: string[]) {
				emit('update:modelValue', newVal);
			},
		});

		const selectedFields = computed({
			get() {
				return internalValue.value.map((field) => ({
					field,
					name: findTree(tree.value, field.split('.'))?.name as string,
				}));
			},
			set(newVal: { field: string; name: string }[]) {
				internalValue.value = newVal.map((field) => field.field);
			},
		});

		const availableFields = computed(() => {
			return parseTree(tree.value);
		});

		return {
			t,
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
					disabled: internalValue.value.includes(prefix + field.field),
					children: parseTree(field.children, prefix + field.field + '.'),
				};
			});

			return newTree.length === 0 ? undefined : newTree;
		}

		function removeField(field: string) {
			internalValue.value = internalValue.value.filter((f) => f !== field);
		}

		function addField(field: string) {
			const newArray = internalValue.value;
			newArray.push(field);
			internalValue.value = [...new Set(newArray)];
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
