<script lang="ts">
export default {
	name: 'NestedDraggable',
};
</script>

<script setup lang="ts">
import {
	ChangesItem,
	DisplayItem,
	RelationQueryMultiple,
	useRelationMultiple,
} from '@/composables/use-relation-multiple';
import { RelationO2M } from '@/composables/use-relation-o2m';
import { hideDragImage } from '@/utils/hide-drag-image';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import { Filter } from '@directus/types';
import { moveInArray } from '@directus/utils';
import { cloneDeep } from 'lodash';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import ItemPreview from './item-preview.vue';

type ChangeEvent =
	| {
			added: {
				newIndex: number;
				element: DisplayItem;
			};
	  }
	| {
			removed: {
				oldIndex: number;
				element: DisplayItem;
			};
	  }
	| {
			moved: {
				newIndex: number;
				oldIndex: number;
				element: DisplayItem;
			};
	  };

const props = withDefaults(
	defineProps<{
		modelValue?: ChangesItem;
		template: string;
		disabled?: boolean;
		collection: string;
		field: string;
		primaryKey: string | number;
		filter?: Filter | null;
		fields: string[];
		relationInfo: RelationO2M;
		root?: boolean;
		enableCreate: boolean;
		enableSelect: boolean;
		customFilter: Filter;
		itemsMoved: (string | number)[];
	}>(),
	{
		disabled: false,
		filter: () => null,
		root: false,
		modelValue: undefined,
	}
);

const { t } = useI18n();
const emit = defineEmits(['update:modelValue']);

const value = computed<ChangesItem | any[]>({
	get() {
		if (props.modelValue === undefined) return [];
		return props.modelValue as ChangesItem;
	},
	set: (val) => {
		emit('update:modelValue', val);
	},
});

const { collection, field, primaryKey, relationInfo, root, fields, template, customFilter } = toRefs(props);

const drag = ref(false);
const open = ref<Record<string, boolean>>({});

const limit = ref(-1);
const page = ref(1);

const query = computed<RelationQueryMultiple>(() => ({
	fields: fields.value,
	limit: limit.value,
	page: page.value,
}));

const { displayItems, create, update, remove, select, cleanItem, isLocalItem, getItemEdits } = useRelationMultiple(
	value,
	query,
	relationInfo,
	primaryKey
);

function getDeselectIcon(item: DisplayItem) {
	if (item.$type === 'deleted') return 'settings_backup_restore';
	if (isLocalItem(item)) return 'delete';
	return 'close';
}

const selectDrawer = ref(false);

const dragOptions = {
	animation: 150,
	group: 'description',
	disabled: false,
	ghostClass: 'ghost',
};

const filteredDisplayItems = computed(() => {
	return displayItems.value.filter(
		(item) =>
			!(props.itemsMoved.includes(item[relationInfo.value.relatedPrimaryKeyField.field]) && item.$type === undefined)
	);
});

function updateModelValue(changes: ChangesItem, index: number) {
	const pkField = relationInfo.value?.relatedPrimaryKeyField.field;
	if (!pkField) return;

	update({
		...displayItems.value[index],
		[field.value]: changes,
	});
}

function change(event: ChangeEvent) {
	if ('added' in event) {
		switch (event.added.element.$type) {
			case 'created':
				create(cleanItem(event.added.element));
				break;

			case 'updated': {
				const pkField = relationInfo.value.relatedPrimaryKeyField.field;
				const exists = displayItems.value.find((item) => item[pkField] === event.added.element[pkField]);

				// We have to make sure we remove the reverseJunctionField when we move it back to its initial position as otherwise it will be selected.
				update({
					...cleanItem(event.added.element),
					[relationInfo.value.reverseJunctionField.field]: exists ? undefined : primaryKey.value,
				});

				break;
			}

			default:
				update({
					...event.added.element,
					[relationInfo.value.reverseJunctionField.field]: primaryKey.value,
				});
		}
	} else if ('removed' in event && '$type' in event.removed.element) {
		remove({
			...event.removed.element,
			[relationInfo.value.reverseJunctionField.field]: primaryKey.value,
		});
	} else if ('moved' in event) {
		sort(event.moved.oldIndex, event.moved.newIndex);
	}
}

function sort(from: number, to: number) {
	const sortField = relationInfo.value.sortField;
	if (!sortField) return;

	const sortedItems = moveInArray(cloneDeep(filteredDisplayItems.value), from, to).map((item, index) => ({
		...item,
		[sortField]: index,
	}));

	update(...sortedItems);
}

const addNewActive = ref(false);

function addNew(item: Record<string, any>) {
	item[relationInfo.value.reverseJunctionField.field] = primaryKey.value;
	create(item);
}

function stageEdits(item: Record<string, any>) {
	update(item);
}
</script>

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
		force-fallback
		@start="drag = true"
		@end="drag = false"
		@change="change($event as ChangeEvent)"
	>
		<template #item="{ element, index }">
			<li class="row" :class="{ draggable: element.$type !== 'deleted' }">
				<item-preview
					:item="element"
					:edits="getItemEdits(element)"
					:template="template"
					:collection="collection"
					:disabled="disabled"
					:relation-info="relationInfo"
					:open="open[element[relationInfo.relatedPrimaryKeyField.field]] ?? false"
					:deleted="element.$type === 'deleted'"
					:delete-icon="getDeselectIcon(element)"
					@update:open="open[element[relationInfo.relatedPrimaryKeyField.field]] = $event"
					@input="stageEdits"
					@deselect="remove(element)"
				/>
				<nested-draggable
					v-if="open[element[relationInfo.relatedPrimaryKeyField.field]]"
					:model-value="element[field]"
					:template="template"
					:collection="collection"
					:disabled="disabled"
					:field="field"
					:fields="fields"
					:enable-create="enableCreate"
					:enable-select="enableSelect"
					:custom-filter="customFilter"
					:relation-info="relationInfo"
					:primary-key="element[relationInfo.relatedPrimaryKeyField.field]"
					:items-moved="itemsMoved"
					@update:model-value="updateModelValue($event, index)"
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
	background-color: var(--theme--primary-background);
	box-shadow: 0 !important;
}

.actions {
	margin-top: 12px;
}

.actions .v-button + .v-button {
	margin-left: 12px;
}
</style>
