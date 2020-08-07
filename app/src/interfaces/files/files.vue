<template>
	<v-notice type="warning" v-if="!relations || relations.length !== 2">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div v-else class="files">
		<v-table
			inline
			:items="previewItems"
			:loading="loading"
			:headers.sync="tableHeaders"
			:item-key="junctionCollectionPrimaryKeyField.field"
			:disabled="disabled"
			@click:row="editExisting"
		>
			<template #item.$thumbnail="{ item }">
				<render-display
					:value="get(item, [relationCurrentToJunction.junction_field])"
					display="file"
					:collection="junctionCollection"
					:field="relationCurrentToJunction.junction_field"
					type="file"
				/>
			</template>

			<template #item-append="{ item }" v-if="!disabled">
				<v-icon name="close" v-tooltip="$t('deselect')" class="deselect" @click.stop="deselect(item)" />
			</template>
		</v-table>

		<div class="actions" v-if="!disabled">
			<v-button class="new" @click="showUpload = true">{{ $t('upload_file') }}</v-button>
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

		<v-dialog v-model="showUpload">
			<v-card>
				<v-card-title>{{ $t('upload_file') }}</v-card-title>
				<v-card-text><v-upload @upload="onUpload" multiple /></v-card-text>
				<v-card-actions>
					<v-button @click="showUpload = false">{{ $t('done') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, toRefs } from '@vue/composition-api';
import { Header as TableHeader } from '@/components/v-table/types';
import ModalBrowse from '@/views/private/components/modal-browse';
import ModalDetail from '@/views/private/components/modal-detail';
import { get } from 'lodash';
import i18n from '@/lang';

import useRelation from '@/interfaces/many-to-many/use-relation';
import useSelection from '@/interfaces/many-to-many/use-selection';
import usePreview from '@/interfaces/many-to-many/use-preview';
import useEdit from '@/interfaces/many-to-many/use-edit';

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
	},
	setup(props, { emit }) {
		const { collection, field, value, primaryKey } = toRefs(props);

		const {
			relations,
			relationCurrentToJunction,
			relationJunctionToRelated,
			junctionCollectionPrimaryKeyField,
			junctionCollection,
			relatedCollectionPrimaryKeyField,
			relatedCollection,
		} = useRelation({ collection, field });

		const fields = computed(() => {
			if (!relationCurrentToJunction.value) return [];
			if (!relationCurrentToJunction.value.junction_field) return [];

			const jf = relationCurrentToJunction.value.junction_field;

			return ['id', 'type', 'title'].map((key) => `${jf}.${key}`);
		});

		const tableHeaders = ref<TableHeader[]>([
			{
				text: '',
				value: '$thumbnail',
				align: 'left',
				sortable: false,
				width: 50,
			},
			{
				text: i18n.t('title'),
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				value: relationCurrentToJunction.value!.junction_field + '.title',
				align: 'left',
				sortable: true,
				width: 250,
			},
		]);

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

		const { showUpload, onUpload } = useUpload();

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
			showUpload,
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
			onUpload,
		};

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

		function useUpload() {
			const showUpload = ref(false);

			return { showUpload, onUpload };

			function onUpload(file: { id: number; [key: string]: any }) {
				if (!relationCurrentToJunction.value) return;
				if (!relationCurrentToJunction.value.junction_field) return;

				const fileAsJunctionRow = {
					[relationCurrentToJunction.value.junction_field]: {
						id: file.id,
					},
				};

				emit('input', [...(props.value || []), fileAsJunctionRow]);

				showUpload.value = false;
			}
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
