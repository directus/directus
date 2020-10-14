<template>
	<v-notice type="warning" v-if="!junction || !relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div v-else class="files">
		<v-table
			inline
			:items="displayItems"
			:loading="loading"
			:headers.sync="tableHeaders"
			:item-key="relationFields.junctionPkField"
			:disabled="disabled"
			@click:row="editItem"
		>
			<template #item.$thumbnail="{ item }">
				<render-display
					:value="item"
					display="file"
					:collection="relationFields.junctionCollection"
					:field="relationFields.relationPkField"
					type="file"
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
			<v-button class="new" @click="showUpload = true">{{ $t('upload_file') }}</v-button>
			<v-button class="existing" @click="selectModalActive = true">
				{{ $t('add_existing') }}
			</v-button>
		</div>

		<modal-detail
			v-if="!disabled"
			:active="currentlyEditing !== null"
			:collection="relationFields.junctionCollection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			:junction-field="relationFields.junctionRelation"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<modal-browse
			v-if="!disabled"
			:active.sync="selectModalActive"
			:collection="relation.one_collection"
			:selection="[]"
			:filters="selectionFilters"
			@input="stageSelection"
			multiple
		/>

		<v-dialog v-model="showUpload">
			<v-card>
				<v-card-title>{{ $t('upload_file') }}</v-card-title>
				<v-card-text><v-upload @input="onUpload" multiple from-url /></v-card-text>
				<v-card-actions>
					<v-button @click="showUpload = false">{{ $t('done') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, toRefs, PropType } from '@vue/composition-api';
import { Header as TableHeader } from '@/components/v-table/types';
import ModalBrowse from '@/views/private/components/modal-browse';
import ModalDetail from '@/views/private/components/modal-detail';
import { get } from 'lodash';
import i18n from '@/lang';

import useActions from '@/interfaces/many-to-many/use-actions';
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
			type: Array as PropType<(string | number | Record<string, any>)[] | null>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const { collection, field, value, primaryKey } = toRefs(props);

		const { junction, junctionCollection, relation, relationCollection, relationFields } = useRelation(
			collection,
			field
		);

		function emitter(newVal: any[] | null) {
			emit('input', newVal);
		}

		const {
			deleteItem,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys,
			getNewSelectedItems,
			getJunctionItem,
			getJunctionFromRelatedId,
		} = useActions(value, relationFields, emitter);

		const fields = ref(['id', 'type', 'title']);

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
				value: 'title',
				align: 'left',
				sortable: true,
				width: 250,
			},
		]);

		const { loading, displayItems, error, items } = usePreview(
			value,
			fields,
			relationFields,
			getNewSelectedItems,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys
		);

		const { cancelEdit, stageEdits, editsAtStart, editItem, currentlyEditing } = useEdit(
			value,
			items,
			relationFields,
			emitter,
			getJunctionFromRelatedId
		);

		const { stageSelection, selectModalActive, selectionFilters } = useSelection(
			value,
			displayItems,
			relationFields,
			emitter
		);

		const { showUpload, onUpload } = useUpload();

		return {
			junction,
			relation,
			tableHeaders,
			junctionCollection,
			loading,
			displayItems,
			error,
			currentlyEditing,
			cancelEdit,
			showUpload,
			stageEdits,
			editsAtStart,
			selectModalActive,
			stageSelection,
			selectionFilters,
			deleteItem,
			items,
			get,
			onUpload,
			relationFields,
			editItem,
		};

		function useUpload() {
			const showUpload = ref(false);

			return { showUpload, onUpload };

			function onUpload(files: Record<string, any>[]) {
				showUpload.value = false;

				if (files.length === 0) return;

				const { junctionRelation } = relationFields.value;
				const file = files[0];

				const fileAsJunctionRow = {
					[junctionRelation]: {
						id: file.id,
						title: file.title,
						type: file.type,
					},
				};

				emit('input', [...(props.value || []), fileAsJunctionRow]);
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
