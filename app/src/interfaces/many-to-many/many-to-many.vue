<template>
	<v-notice type="warning" v-if="!junction || !relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div class="many-to-many" v-else>
		<v-list>
			<draggable
				:force-fallback="true"
				:value="sortedItems || items"
				@input="sortItems($event)"
				handler=".drag-handle"
				:disabled="!relation.sort_field"
			>
				<v-list-item v-for="item in sortedItems || items" :key="item.id" block @click="editItem(item)">
					<v-icon v-if="relation.sort_field" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />
					<render-template :item="item" :template="templateWithDefaults" />
					<div class="spacer" />
					<v-icon name="close" @click.stop="deleteItem(item)" />
				</v-list-item>
			</draggable>
		</v-list>

		<div class="actions" v-if="!disabled">
			<v-button class="new" @click="editModalActive = true">{{ $t('create_new') }}</v-button>
			<v-button class="existing" @click="selectModalActive = true">
				{{ $t('add_existing') }}
			</v-button>
		</div>

		<drawer-item
			v-if="!disabled"
			:active="editModalActive"
			:collection="relationInfo.junctionCollection"
			:primary-key="currentlyEditing || '+'"
			:related-primary-key="relatedPrimaryKey || '+'"
			:junction-field="relationInfo.junctionField"
			:edits="editsAtStart"
			:circular-field="junction.many_field"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<drawer-collection
			v-if="!disabled"
			:active.sync="selectModalActive"
			:collection="relationCollection.collection"
			:selection="[]"
			:filters="selectionFilters"
			@input="stageSelection"
			multiple
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType, toRefs } from '@vue/composition-api';
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import { get } from 'lodash';
import Draggable from 'vuedraggable';

import useActions from './use-actions';
import useRelation from './use-relation';
import usePreview from './use-preview';
import useEdit from './use-edit';
import useSelection from './use-selection';
import useSort from './use-sort';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';

export default defineComponent({
	components: { DrawerItem, DrawerCollection, Draggable },
	props: {
		value: {
			type: Array as PropType<(number | string | Record<string, any>)[] | null>,
			default: null,
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		template: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const { value, collection, field } = toRefs(props);

		const { junction, junctionCollection, relation, relationCollection, relationInfo } = useRelation(collection, field);

		const templateWithDefaults = computed(
			() => props.template || junctionCollection.value.meta?.display_template || `{{${junction.value.many_primary}}}`
		);

		const fields = computed(() => getFieldsFromTemplate(templateWithDefaults.value));

		const { deleteItem, getUpdatedItems, getNewItems, getPrimaryKeys, getNewSelectedItems } = useActions(
			value,
			relationInfo,
			emitter
		);

		const { tableHeaders, items, loading, error } = usePreview(
			value,
			fields,
			relationInfo,
			getNewSelectedItems,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys
		);

		const {
			currentlyEditing,
			editItem,
			editsAtStart,
			stageEdits,
			cancelEdit,
			relatedPrimaryKey,
			editModalActive,
		} = useEdit(value, relationInfo, emitter);

		const { stageSelection, selectModalActive, selectionFilters } = useSelection(value, items, relationInfo, emitter);

		const { sort, sortItems, sortedItems } = useSort(relationInfo, fields, items, emitter);

		return {
			junction,
			relation,
			tableHeaders,
			loading,
			currentlyEditing,
			editItem,
			junctionCollection,
			relationCollection,
			editsAtStart,
			stageEdits,
			cancelEdit,
			stageSelection,
			selectModalActive,
			deleteItem,
			selectionFilters,
			items,
			relationInfo,
			relatedPrimaryKey,
			get,
			editModalActive,
			sort,
			sortItems,
			sortedItems,
			templateWithDefaults,
		};

		function emitter(newVal: any[] | null) {
			emit('input', newVal);
		}
	},
});
</script>

<style lang="scss" scoped>
.actions {
	margin-top: 12px;
}

.existing {
	margin-left: 12px;
}

.deselect {
	--v-icon-color: var(--foreground-subdued);

	&:hover {
		--v-icon-color: var(--danger);
	}
}
</style>
