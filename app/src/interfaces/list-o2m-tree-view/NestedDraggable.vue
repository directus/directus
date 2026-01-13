<script setup lang="ts">
import type { ContentVersion, Filter } from '@directus/types';
import { moveInArray } from '@directus/utils';
import { cloneDeep } from 'lodash';
import { computed, ref, toRefs } from 'vue';
import Draggable from 'vuedraggable';
import ItemPreview from './item-preview.vue';
import VButton from '@/components/v-button.vue';
import VListItem from '@/components/v-list-item.vue';
import VNotice from '@/components/v-notice.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
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
		collection: string;
		field: string;
		primaryKey: string | number;
		disabled?: boolean;
		nonEditable?: boolean;
		version: ContentVersion | null;
		template: string;
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
		nonEditable: false,
		filter: null,
		root: false,
		modelValue: undefined,
	},
);

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

const { collection, field, primaryKey, relationInfo, root, fields, template, customFilter, version } = toRefs(props);

const addNewActive = defineModel<boolean>('addNewOpen');
const selectDrawer = defineModel<boolean>('selectOpen');
const editOpen = defineModel<boolean>('editOpen');

const drag = ref(false);
const open = ref<Record<string, boolean>>({});

const limit = ref(-1);
const page = ref(1);

const query = computed<RelationQueryMultiple>(() => ({
	fields: fields.value,
	limit: limit.value,
	page: page.value,
}));

const { displayItems, loading, create, update, remove, select, cleanItem, isLocalItem, getItemEdits } =
	useRelationMultiple(value, query, relationInfo, primaryKey, version);

const dragOptions = {
	animation: 150,
	group: 'description',
	disabled: false,
	ghostClass: 'ghost',
	forceFallback: true,
};

const filteredDisplayItems = computed(() => {
	return displayItems.value.filter(
		(item) =>
			!(props.itemsMoved.includes(item[relationInfo.value.relatedPrimaryKeyField.field]) && item.$type === undefined),
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

function addNew(item: Record<string, any>) {
	item[relationInfo.value.reverseJunctionField.field] = primaryKey.value;
	create(item);
}

function stageEdits(item: Record<string, any>) {
	update(item);
}
</script>

<template>
	<VSkeletonLoader v-if="loading" type="block-list-item" />

	<template v-else-if="root && filteredDisplayItems.length === 0">
		<VNotice>
			{{ $t('no_items') }}
		</VNotice>
	</template>

	<Draggable
		v-bind="dragOptions"
		class="drag-area"
		:class="{ root, drag }"
		tag="v-list"
		:model-value="filteredDisplayItems"
		:group="{ name: 'g1' }"
		item-key="id"
		draggable=".draggable"
		:set-data="hideDragImage"
		:disabled="disabled"
		@start="drag = true"
		@end="drag = false"
		@change="change($event as ChangeEvent)"
	>
		<template #item="{ element, index }">
			<VListItem :non-editable="nonEditable" class="row" :class="{ draggable: element.$type !== 'deleted' }">
				<ItemPreview
					v-model:edit-open="editOpen"
					:item="element"
					:edits="getItemEdits(element)"
					:template="template"
					:collection="collection"
					:disabled="disabled"
					:non-editable="nonEditable"
					:relation-info="relationInfo"
					:open="open[element[relationInfo.relatedPrimaryKeyField.field]] ?? false"
					:deleted="element.$type === 'deleted'"
					:is-local-item="isLocalItem(element)"
					@update:open="open[element[relationInfo.relatedPrimaryKeyField.field]] = $event"
					@input="stageEdits"
					@deselect="remove(element)"
				/>
				<NestedDraggable
					v-if="open[element[relationInfo.relatedPrimaryKeyField.field]]"
					v-model:edit-open="editOpen"
					:model-value="element[field]"
					:template="template"
					:collection="collection"
					:disabled="disabled"
					:non-editable="nonEditable"
					:field="field"
					:fields="fields"
					:version="version"
					:enable-create="enableCreate"
					:enable-select="enableSelect"
					:custom-filter="customFilter"
					:relation-info="relationInfo"
					:primary-key="element[relationInfo.relatedPrimaryKeyField.field]"
					:items-moved="itemsMoved"
					@update:model-value="updateModelValue($event, index)"
				/>
			</VListItem>
		</template>
	</Draggable>

	<template v-if="root">
		<div v-if="!nonEditable" class="actions">
			<VButton v-if="enableCreate" :disabled @click="addNewActive = true">{{ $t('create_new') }}</VButton>
			<VButton v-if="enableSelect" :disabled @click="selectDrawer = true">{{ $t('add_existing') }}</VButton>
		</div>

		<DrawerItem
			:disabled
			:non-editable
			:active="addNewActive"
			:collection="collection"
			:primary-key="'+'"
			:edits="{}"
			:circular-field="relationInfo.reverseJunctionField.field"
			@input="addNew"
			@update:active="addNewActive = false"
		/>

		<DrawerCollection
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
@use '@/styles/mixins';

.drag-area {
	min-block-size: 12px;

	&.root {
		margin-inline-start: 0;
		padding: 0;

		.v-skeleton-loader {
			margin: 12px 0 12px auto;
			inline-size: calc(100% - 24px);
		}

		&:empty {
			min-block-size: 0;
		}
	}

	&.v-list {
		@include mixins.list-interface;

		overflow: hidden;
	}
}

.row {
	.preview {
		padding: 12px;
		cursor: grab;
		background-color: var(--theme--background);
		border: var(--theme--border-width) solid var(--theme--border-color);
		border-radius: var(--theme--border-radius);

		& + .drag-area {
			padding: 0;

			> .v-list-item:first-child {
				margin-block-start: 8px;
			}
		}
	}

	&.v-list-item {
		display: block;

		--v-list-item-padding: 0;
		--v-list-item-margin: 0;

		+ .v-list-item {
			margin-block-start: 8px;
		}
	}

	&:not(.draggable) .preview {
		cursor: not-allowed;
	}
}

.ghost .preview {
	background-color: var(--theme--primary-background);
}

.actions {
	@include mixins.list-interface-actions;
}
</style>
