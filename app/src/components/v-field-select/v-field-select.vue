<template>
	<v-notice v-if="!availableFields || availableFields.length === 0">
		{{ t('no_fields_in_collection', { collection: (collectionInfo && collectionInfo.name) || collection }) }}
	</v-notice>

	<draggable
		v-else
		v-model="selectedFields"
		:force-fallback="true"
		item-key="field"
		draggable=".draggable"
		:set-data="hideDragImage"
		class="v-field-select"
	>
		<template #item="{ element }">
			<v-chip v-tooltip="element.field" clickable class="field draggable" @click="removeField(element.field)">
				{{ element.name }}
			</v-chip>
		</template>

		<template #footer>
			<v-menu v-model="menuActive" show-arrow class="add" placement="bottom">
				<template #activator="{ toggle }">
					<v-button small @click="toggle">
						{{ t('add_field') }}
						<v-icon small name="add" />
					</v-button>
				</template>

				<v-list :mandatory="false" @toggle="loadFieldRelations($event.value, 1)">
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
import { Field, Relation } from '@directus/shared/types';
import { Collection } from '@/types';
import Draggable from 'vuedraggable';
import { useCollection } from '@directus/shared/composables';
import { FieldTree } from '../v-field-template/types';
import hideDragImage from '@/utils/hide-drag-image';
import { useFieldTree } from '@/composables/use-field-tree';

export default defineComponent({
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
			default: undefined,
		},
		inject: {
			type: Object as PropType<{ fields: Field[]; collections: Collection[]; relations: Relation[] } | null>,
			default: () => ({ fields: [], collections: [], relations: [] }),
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const menuActive = ref(false);
		const { collection, inject } = toRefs(props);

		const { info } = useCollection(collection);
		const { treeList, loadFieldRelations } = useFieldTree(collection, inject);

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
					name: findTree(treeList.value, field.split('.'))?.name as string,
				}));
			},
			set(newVal: { field: string; name: string }[]) {
				internalValue.value = newVal.map((field) => field.field);
			},
		});

		const availableFields = computed(() => {
			return parseTree(treeList.value);
		});

		return {
			t,
			menuActive,
			addField,
			removeField,
			availableFields,
			selectedFields,
			hideDragImage,
			treeList,
			loadFieldRelations,
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
