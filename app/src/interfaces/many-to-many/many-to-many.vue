<template>
	<v-notice type="warning" v-if="!junction || !relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div class="one-to-many" v-else>
		<v-table
			:loading="loading"
			:items="displayItems"
			:headers.sync="tableHeaders"
			show-resize
			inline
			@click:row="editItem"
			:disabled="disabled"
		>
			<template v-for="header in tableHeaders" v-slot:[`item.${header.value}`]="{ item }">
				<render-display
					:key="header.value"
					:value="item[header.value]"
					:display="header.field.display"
					:options="header.field.displayOptions"
					:interface="header.field.interface"
					:interface-options="header.field.interfaceOptions"
					:type="header.field.type"
					:collection="junctionCollection.collection"
					:field="header.field.field"
				/>
			</template>

			<template #item-append="{ item }" v-if="!disabled">
				<v-icon
					name="close"
					v-tooltip="$t('deselect')"
					class="deselect"
					@click.stop="deleteItem(item, items)"
				/>
			</template>
		</v-table>

		<div class="actions" v-if="!disabled">
			<v-button class="new" @click="currentlyEditing = '+'">{{ $t('create_new') }}</v-button>
			<v-button class="existing" @click="selectModalActive = true">
				{{ $t('add_existing') }}
			</v-button>
		</div>

		<pre>{{ JSON.stringify(value, null, 4) }}</pre>

		<modal-detail
			v-if="!disabled"
			:active="currentlyEditing !== null"
			:collection="relationCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<modal-browse
			v-if="!disabled"
			:active.sync="selectModalActive"
			:collection="relationCollection.collection"
			:selection="selectedPrimaryKeys"
			:filters="[]"
			@input="stageSelection"
			multiple
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType, toRefs } from '@vue/composition-api';
import ModalDetail from '@/views/private/components/modal-detail';
import ModalBrowse from '@/views/private/components/modal-browse';

import useActions from './use-actions';
import useRelation from './use-relation';
import usePreview from './use-preview';
import useEdit from './use-edit';
import useSelection from './use-selection';

export default defineComponent({
	components: { ModalDetail, ModalBrowse },
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
		fields: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const { value, collection, field, fields } = toRefs(props);

		function emitter(newVal: any[] | null) {
			emit('input', newVal);
		}

		const { junction, junctionCollection, relation, relationCollection, relationFields } = useRelation(
			collection,
			field
		);

		const {
			deleteItem,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys,
			getNewSelectedItems,
			getJunctionItem,
			getJunctionFromRelatedId,
		} = useActions(value, relationFields, emitter);

		const { tableHeaders, items, loading, error, displayItems } = usePreview(
			value,
			fields,
			relationFields,
			getNewSelectedItems,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys
		);

		const { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit } = useEdit(
			value,
			items,
			relationFields,
			emitter,
			getJunctionFromRelatedId
		);

		const { stageSelection, selectModalActive, selectedPrimaryKeys } = useSelection(
			items,
			displayItems,
			relationFields,
			emitter,
			getNewItems,
			getJunctionFromRelatedId,
			getJunctionItem
		);

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
			displayItems,
			selectedPrimaryKeys,
			items,
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
