<template>
	<v-notice type="warning" v-if="!junction || !relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div class="many-to-many" v-else>
		<repeater-list
			:value="sortedItems || items"
			:template="template"
			@active="editItem(getItemFromIndex($event))"
			@delete="deleteItem(getItemFromIndex($event))"
		></repeater-list>
		<!-- <v-table
			:loading="loading"
			:items="sortedItems || items"
			:headers.sync="tableHeaders"
			show-resize
			inline
			:sort.sync="sort"
			@update:items="sortItems($event)"
			@click:row="editItem"
			:disabled="disabled"
			:show-manual-sort="sortField !== null"
			:manual-sort-key="sortField"
		>
			<template v-for="header in tableHeaders" v-slot:[`item.${header.value}`]="{ item }">
				<render-display
					:key="header.value"
					:value="get(item, header.value)"
					:display="header.field.display"
					:options="header.field.displayOptions"
					:interface="header.field.interface"
					:interface-options="header.field.interfaceOptions"
					:type="header.field.type"
					:collection="relationInfo.junctionCollection"
					:field="header.field.field"
				/>
			</template>

			<template #item-append="{ item }" v-show="!disabled">
				<v-icon name="close" v-tooltip="$t('deselect')" class="deselect" @click.stop="deleteItem(item)" />
			</template>
		</v-table> -->

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

import useActions from './use-actions';
import useRelation from './use-relation';
import usePreview from './use-preview';
import useEdit from './use-edit';
import useSelection from './use-selection';
import useSort from './use-sort';
import RepeaterList from '@/interfaces/repeater/repeater-list.vue';
import { getFieldsFromTemplate } from '@/utils/render-template';

export default defineComponent({
	components: { DrawerItem, DrawerCollection, RepeaterList },
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
		sortField: {
			type: String,
			default: null,
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
		const { value, collection, field, template, sortField } = toRefs(props);
		const fields = computed(() => getFieldsFromTemplate(template.value));

		function emitter(newVal: any[] | null) {
			emit('input', newVal);
		}

		const { junction, junctionCollection, relation, relationCollection, relationInfo } = useRelation(collection, field);

		const {
			deleteItem,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys,
			getNewSelectedItems,
			getJunctionItem,
			getJunctionFromRelatedId,
		} = useActions(value, relationInfo, emitter);

		const { tableHeaders, items, loading, error } = usePreview(
			value,
			fields,
			sortField,
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

		const { sort, sortItems, sortedItems } = useSort(sortField, fields, items, emitter);

		function getItemFromIndex(index: number) {
			return (sortedItems.value || items.value)[index];
		}

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
			getItemFromIndex,
		};
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
