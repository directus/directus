<template>
	<draggable
		v-bind="dragOptions"
		class="drag-area"
		:class="{ root, drag }"
		tag="ul"
		:model-value="filteredDisplayItems"
		:group="{ name: 'g1' }"
		item-key="id"
		draggable=".draggable"
		:set-data="hideDragImage"
		:disabled="disabled"
		:force-fallback="true"
		@start="drag = true"
		@end="drag = false"
		@change="change($event as ChangeEvent)"
	>
		<template #item="{ element, index }">
			<li class="row" :class="{draggable: element.$type !== 'deleted'}">
				<item-preview
					:item="element"
					:template="template"
					:collection="collection"
					:disabled="disabled"
					:relation-info="relationInfo"
					:open="open[index] ?? false"
					:deleted="element.$type === 'deleted'"
					@update:open="open[index] = $event"
					@input="update"
					@deselect="remove(element)"
				/>
				<nested-draggable
					v-if="open[index]"
					v-model="globalValue"
					:template="template"
					:collection="collection"
					:disabled="disabled"
					:field="field"
					:fields="fields"
					:enableCreate="enableCreate"
					:enableSelect="enableSelect"
					:customFilter="customFilter"
					:relationInfo="relationInfo"
					:primaryKey="element[relationInfo.relatedPrimaryKeyField.field]"
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
			@input="select"
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
import { DisplayItem, RelationO2M, RelationQueryMultiple, useRelationMultiple, ChangesItem } from '@/composables/use-relation';
import DrawerCollection from '@/views/private/components/drawer-collection';
import DrawerItem from '@/views/private/components/drawer-item';
import { useSync } from '@directus/shared/composables';
import { useI18n } from 'vue-i18n';

type ChangeEvent = {
	added: {
		newIndex: number
		element: DisplayItem
	}
} | {
	removed: {
		oldIndex: number
		element: DisplayItem
	}
} | {
	moved: {
		newIndex: number
		oldIndex: number
		element: DisplayItem
	}
}

const props = withDefaults(defineProps<{
	modelValue: ChangesItem
	template: string
	disabled?: boolean
	collection: string
	field: string
	primaryKey: string | number
	filter?: Filter | null
	fields: string[]
	relationInfo: RelationO2M
	root?: boolean
	enableCreate: boolean
	enableSelect: boolean
	customFilter: Filter
}>(), {
	disabled: false,
	filter: () => null,
	root: false,
})

const { t } = useI18n();
const emit = defineEmits(['update:modelValue'])

const globalValue = useSync(props, 'modelValue', emit)

const value = computed<ChangesItem>(() => {
	if(!('create' in globalValue.value)) return {
		create: [],
		update: [],
		delete: []
	}

	const parentField = relationInfo.value.reverseJunctionField.field
	return {
		create: globalValue.value.create.filter(item => item[parentField] === primaryKey.value),
		update: globalValue.value.update.filter(item => item[parentField] === primaryKey.value),
		delete: globalValue.value.delete
	}
})

const {collection, field, primaryKey, relationInfo, root, fields, template, customFilter} = toRefs(props)

const drag = ref(false);
const open = ref<boolean[]>([])

const editActive = ref(false);
const dragging = ref(false);

const limit = ref(-1);
const page = ref(1);

const query = computed<RelationQueryMultiple>(() => ({
	fields: fields.value,
	limit: limit.value,
	page: page.value,
}));

const {displayItems, loading, useActions} = useRelationMultiple(value, query, relationInfo, primaryKey)
const {create, update, remove, select} = useActions(globalValue)

const selectDrawer = ref(false);

const dragOptions = {
	animation: 150,
	group: 'description',
	disabled: false,
	ghostClass: 'ghost',
}

const selectedPrimaryKeys = computed<(number | string)[]>(() => {
	const pkField = relationInfo.value?.relatedPrimaryKeyField.field
	if (!pkField || !props.primaryKey) return [];

	return []
});

const existingMoved = computed<(string | number)[]>(() => {
	return globalValue.value.update.filter(item => relationInfo.value.reverseJunctionField.field in item).map(item => item[relationInfo.value.relatedPrimaryKeyField.field])
})

const filteredDisplayItems = computed(() => {
	return displayItems.value.filter(item => !existingMoved.value.includes(item[relationInfo.value.relatedPrimaryKeyField.field]) || item.$type !== undefined)
})

function change(event: ChangeEvent) {
	if('added' in event) {
		const pkField = relationInfo.value.relatedPrimaryKeyField.field
		if(existingMoved.value.includes(event.added.element[pkField]) && displayItems.value.find(item => item[pkField] === event.added.element[pkField])) {
			remove(event.added.element)
		} else {
			update({
				...event.added.element,
				[relationInfo.value.reverseJunctionField.field]: primaryKey.value
			})
		}
		
	}
	
}

const addNewActive = ref(false);

function addNew(item: Record<string, any>) {
	item[relationInfo.value.reverseJunctionField.field] = primaryKey.value
	console.log("create ", item)
	create(item)
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

		& + .drag-area {
			padding-top: 12px;
		}
	}

	&:not(.draggable) .preview {
		cursor: not-allowed;
	}
}

.ghost .preview {
	background-color: var(--primary-alt);
	box-shadow: 0 !important;
}
</style>
