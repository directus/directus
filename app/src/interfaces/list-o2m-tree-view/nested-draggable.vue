<template>
	<draggable
		v-bind="dragOptions"
		class="drag-area"
		:class="{ root, drag }"
		tag="ul"
		:list="tree"
		:group="{ name: 'g1' }"
		item-key="id"
		draggable=".row"
		:set-data="hideDragImage"
		:disabled="disabled"
		:force-fallback="true"
		@start="drag = true"
		@end="drag = false"
		@change="$emit('change', $event)"
	>
		<template #item="{ element, index }">
			<li class="row">
				<item-preview
					:item="element"
					:template="template"
					:collection="collection"
					:primary-key-field="primaryKeyField"
					:disabled="disabled"
					:parent-field="parentField"
					@input="replaceItem(index, $event)"
					@deselect="removeItem(index)"
				/>
				<nested-draggable
					:tree="element[childrenField] || []"
					:template="template"
					:collection="collection"
					:primary-key-field="primaryKeyField"
					:parent-field="parentField"
					:children-field="childrenField"
					:disabled="disabled"
					@change="$emit('change', $event)"
					@input="replaceChildren(index, $event)"
				/>
			</li>
		</template>
	</draggable>

	<template v-if="root">
		<div v-if="!disabled" class="actions">
			<v-button v-if="enableCreate" @click="addNewActive = true">{{ t('create_new') }}</v-button>
			<v-button v-if="enableSelect" @click="selectDrawer = true">{{ t('add_existing') }}</v-button>
		</div>

		<drawer-item
			v-if="!disabled"
			:active="addNewActive"
			:collection="collection"
			:primary-key="'+'"
			:edits="{}"
			:circular-field="relationInfo.reverseJunctionField.field"
			@input="addNew"
			@update:active="addNewActive = false"
		/>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectDrawer"
			:collection="collection"
			:selection="[]"
			:filter="customFilter"
			multiple
			@input="stageSelection"
		/>
	</template>
</template>

<script lang="ts">
export default {
	name: 'NestedDraggable',
}
</script>

<script setup lang="ts">
import Draggable from 'vuedraggable';
import { computed, ref, toRefs } from 'vue';
import hideDragImage from '@/utils/hide-drag-image';
import ItemPreview from './item-preview.vue';
import { Filter } from '@directus/shared/types';
import { RelationO2M, RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation';
import DrawerCollection from '@/views/private/components/drawer-collection';
import DrawerItem from '@/views/private/components/drawer-item';
import { useSync } from '@directus/shared/composables';

const props = withDefaults(defineProps<{
	value?: (number | string | Record<string, any>)[] | Record<string, any>
	template?: string
	disabled?: boolean
	collection: string
	field: string
	primaryKey: string | number
	filter?: Filter | null
	fields: string[]
	relationInfo?: RelationO2M
	root?: boolean
}>(), {
	value: () => [],
	disabled: false,
	filter: () => null,
	root: false
})

const emit = defineEmits(['change', 'update:input'])

const value = useSync(props, 'value', emit)

const {collection, field, primaryKey, relationInfo, root, fields} = toRefs(props)

const drag = ref(false);

const editActive = ref(false);
const dragging = ref(false);

const limit = ref(-1);
const page = ref(1);

const query = computed<RelationQueryMultiple>(() => ({
	fields: fields.value,
	limit: limit.value,
	page: page.value,
}));

const {create, update, remove, select, displayItems, loading} = useRelationMultiple(value, query, relationInfo, primaryKey)

const selectDrawer = ref(false);

const selectedPrimaryKeys = computed<(number | string)[]>(() => {
	const pkField = relationInfo.value?.relatedPrimaryKeyField.field
	if (!pkField || !props.primaryKey) return [];

	return [props.primaryKey, ...getPKs(displayItems.value)];

	function getPKs(values: Record<string, any>[]): (string | number)[] {
		const pks = [];

		if (pkField)
			for (const value of values) {
				if (!value[pkField]) continue;
				pks.push(value[pkField]);
				const childPKs = getPKs(value[relationInfo.value.]);
				pks.push(...childPKs);
			}

		return pks;
	}
});

async function stageSelection(items: (number | string)[]) {
	console.log(items)
	select(items)
}

const addNewActive = ref(false);

function addNew(item: Record<string, any>) {
	console.log("create ", item)
	create(item)
}

function replaceItem(index: number, item: Record<string, any>) {
	emit(
		'input',
		props.tree.map((child, childIndex) => {
			if (childIndex === index) {
				return item;
			}
			return child;
		})
	);
}

function removeItem(index: number) {
	emit(
		'input',
		props.tree.filter((child, childIndex) => childIndex !== index)
	);
}

function replaceChildren(index: number, tree: Record<string, any>[]) {
	emit(
		'input',
		props.tree.map((child, childIndex) => {
			if (childIndex === index) {
				return {
					...child,
					[props.childrenField]: tree,
				};
			}

			return child;
		})
	);
}
</script>

<style lang="scss" scoped>
.drag-area {
	min-height: 12px;

	&.root {
		margin-left: 0;
		padding: 0;

		&:empty {
			min-height: 0;
		}
	}
}

.row {
	.preview {
		padding: 12px;
		background-color: var(--card-face-color);
		border-radius: var(--border-radius);
		box-shadow: 0px 0px 6px 0px rgb(var(--card-shadow-color), 0.2);
		cursor: grab;
		transition: var(--fast) var(--transition);
		transition-property: box-shadow, background-color;

		& + .drag-area:not(:empty) {
			padding-top: 12px;
		}
	}
}

.ghost .preview {
	background-color: var(--primary-alt);
	box-shadow: 0 !important;
}
</style>
