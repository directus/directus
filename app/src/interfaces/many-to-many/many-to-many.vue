<template>
	<v-notice type="warning" v-if="!relations || relations.length !== 2">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div v-else>
		<v-table
			inline
			:items="previewItems"
			:loading="loading"
			:headers.sync="tableHeaders"
			:item-key="junctionCollectionPrimaryKeyField.field"
			:disabled="disabled"
			@click:row="editExisting"
			show-resize
		>
			<template v-for="header in tableHeaders" v-slot:[`item.${header.value}`]="{ item }">
				<render-display
					:key="header.value"
					:value="get(item, header.value)"
					:display="header.field.display"
					:options="header.field.display_options"
					:interface="header.field.interface"
					:interface-options="header.field.options"
					:type="header.field.type"
					:collection="header.field.collection"
					:field="header.field.field"
				/>
			</template>

			<template #item-append="{ item }" v-if="!disabled">
				<v-icon name="close" v-tooltip="$t('deselect')" class="deselect" @click.stop="deselect(item)" />
			</template>
		</v-table>

		<div class="actions" v-if="!disabled">
			<v-button class="new" @click="addNew">{{ $t('create_new') }}</v-button>
			<v-button class="existing" @click="showBrowseModal = true">
				{{ $t('add_existing') }}
			</v-button>
		</div>

		<modal-detail
			v-if="!disabled"
			:active="showDetailModal"
			:collection="junctionCollection"
			:primary-key="junctionRowPrimaryKey"
			:edits="editsAtStart"
			:junction-field="relationCurrentToJunction.junction_field"
			:related-primary-key="relatedRowPrimaryKey"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<modal-browse
			v-if="!disabled"
			:active.sync="showBrowseModal"
			:collection="relationJunctionToRelated.one_collection"
			:selection="[]"
			:filters="selectionFilters"
			@input="stageSelection"
			multiple
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType, toRefs } from '@vue/composition-api';
import { useFieldsStore } from '@/stores/';
import { Header as TableHeader } from '@/components/v-table/types';
import ModalBrowse from '@/views/private/components/modal-browse';
import ModalDetail from '@/views/private/components/modal-detail';
import { get } from 'lodash';

import useRelation from './use-relation';
import useSelection from './use-selection';
import usePreview from './use-preview';
import useEdit from './use-edit';

/**
 * Hi there!
 *
 * The many to many is super complex. Please take proper care when jumping in here and making changes,
 * you might break more than you'd imagine.
 *
 * If you have any questions, please feel free to reach out to Rijk <rijkvanzanten@me.com>
 *
 * NOTE: Some of the logic here is based on the fact that you can only have 1 copy of a related item
 * associated in the m2m at a time. Without this requirement, there isn't a way to know which item
 * you're editing at a time. It would also be near impossible to keep track of the changes made to the
 * related item. Seeing we stage the made edits nested so the api is able to update it, we would have
 * to apply the same edits nested to all the junction rows or something like that, pretty tricky stuff
 *
 * Another NOTE: There's one other tricky case to be aware of: selecting an existing related item. In that case,
 * the junction row doesn't exist yet, but the related item does. Be aware that you can't rely on the
 * primary key of the junction row in some cases.
 */

export default defineComponent({
	components: { ModalBrowse, ModalDetail },
	props: {
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
		value: {
			type: Array,
			default: undefined,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		fields: {
			type: Array as PropType<string[]>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();

		const { collection, field, value, primaryKey, fields } = toRefs(props);

		const {
			relations,
			relationCurrentToJunction,
			relationJunctionToRelated,
			junctionCollectionPrimaryKeyField,
			junctionCollection,
			relatedCollectionPrimaryKeyField,
			relatedCollection,
		} = useRelation({ collection, field });

		const { tableHeaders } = useTable();

		const { loading, previewItems, error } = usePreview({
			value,
			primaryKey,
			junctionCollectionPrimaryKeyField,
			relatedCollectionPrimaryKeyField,
			junctionCollection,
			relatedCollection,
			relationCurrentToJunction,
			relationJunctionToRelated,
			fields,
		});

		const {
			showDetailModal,
			cancelEdit,
			addNew,
			stageEdits,
			editsAtStart,
			junctionRowPrimaryKey,
			editExisting,
			relatedRowPrimaryKey,
			initialValues,
		} = useEdit({
			relationCurrentToJunction,
			junctionCollectionPrimaryKeyField,
			relatedCollectionPrimaryKeyField,
			value,
			onEdit: (newValue) => emit('input', newValue),
		});

		const { showBrowseModal, stageSelection, selectionFilters } = useSelection({
			relationCurrentToJunction,
			relatedCollectionPrimaryKeyField,
			previewItems,
			onStageSelection: (selectionAsJunctionRows) => {
				emit('input', [...(props.value || []), ...selectionAsJunctionRows]);
			},
		});

		return {
			relations,
			relationCurrentToJunction,
			relationJunctionToRelated,
			tableHeaders,
			junctionCollectionPrimaryKeyField,
			junctionCollection,
			loading,
			previewItems,
			error,
			showDetailModal,
			cancelEdit,
			addNew,
			stageEdits,
			editsAtStart,
			junctionRowPrimaryKey,
			editExisting,
			relatedRowPrimaryKey,
			showBrowseModal,
			stageSelection,
			selectionFilters,
			relatedCollection,
			initialValues,
			get,
			deselect,
		};

		/**
		 * Manages the state of the table. This includes the table headers, and the event handlers for
		 * the table events
		 */
		function useTable() {
			// Using a ref for the table headers here means that the table itself can update the
			// values if it needs to. This allows the user to manually resize the columns for example
			const tableHeaders = ref<TableHeader[]>([]);

			watch(() => props.fields, setHeaders);

			return { tableHeaders };

			function setHeaders() {
				if (!props.fields) return;

				tableHeaders.value = props.fields.map(
					(fieldKey): TableHeader => {
						const fieldInfo = fieldsStore.getField(junctionCollection.value, fieldKey);

						return {
							text: fieldInfo.name,
							value: fieldKey,
							align: 'left',
							sortable: true,
							width: null,
							field: fieldInfo,
						};
					}
				);
			}
		}

		/**
		 * Deselect an item. This either means undoing any changes made (new item), or adding $delete: true
		 * if the junction row already exists.
		 */
		function deselect(junctionRow: any) {
			const primaryKey = junctionRow[junctionCollectionPrimaryKeyField.value.field];

			// If the junction row has a primary key, it's an existing item in the junction row, and
			// we want to add the $delete flag so the API can delete the row in the junction table,
			// effectively deselecting the related item from this item
			if (primaryKey) {
				// Once you deselect an item, it's removed from the preview table. You can only
				// deselect an item once, so we don't have to check if this item was already disabled
				emit('input', [
					...(props.value || []),
					{
						[junctionCollectionPrimaryKeyField.value.field]: primaryKey,
						$delete: true,
					},
				]);

				return;
			}

			// If the item doesn't exist yet, there must be a staged edit for it's creation, that's
			// the thing we want to filter out of the staged edits.
			emit(
				'input',
				props.value.filter((stagedValue) => {
					return stagedValue !== junctionRow && stagedValue !== junctionRow['$stagedEdits'];
				})
			);
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
