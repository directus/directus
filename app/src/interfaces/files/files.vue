<template>
	<v-notice type="warning" v-if="!junction || !relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div v-else class="files">
		<v-table
			inline
			:items="sortedItems || items"
			:loading="loading"
			:headers.sync="tableHeaders"
			:item-key="relationInfo.junctionPkField"
			:disabled="disabled"
			@update:items="sortItems($event)"
			@click:row="editItem"
			:show-manual-sort="relationInfo.sortField !== null"
			:manual-sort-key="relationInfo.sortField"
		>
			<template #item.$thumbnail="{ item }">
				<render-display
					:value="get(item, relationInfo.junctionField)"
					display="file"
					:collection="relationInfo.junctionCollection"
					:field="relationInfo.relationPkField"
					type="file"
				/>
			</template>

			<template #item-append="{ item }" v-show="!disabled">
				<v-icon name="save_alt" v-tooltip="$t('download')" class="download" @click.stop="downloadItem(item)" />
				<v-icon name="close" v-tooltip="$t('deselect')" class="deselect" @click.stop="deleteItem(item)" />
			</template>
		</v-table>

		<div class="actions" v-if="!disabled">
			<v-button class="new" @click="showUpload = true">{{ $t('upload_file') }}</v-button>
			<v-button class="existing" @click="selectModalActive = true">
				{{ $t('add_existing') }}
			</v-button>
		</div>

		<drawer-item
			v-if="!disabled"
			:active="editModalActive"
			:collection="relationInfo.junctionCollection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			:related-primary-key="relatedPrimaryKey || '+'"
			:junction-field="relationInfo.junctionField"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<drawer-collection
			v-if="!disabled"
			:active.sync="selectModalActive"
			:collection="relationInfo.relationCollection"
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
import DrawerCollection from '@/views/private/components/drawer-collection';
import DrawerItem from '@/views/private/components/drawer-item';
import { get } from 'lodash';
import i18n from '@/lang';
import { getRootPath } from '@/utils/get-root-path';
import { addTokenToURL } from '@/api';

import useActions from '@/interfaces/many-to-many/use-actions';
import useRelation from '@/interfaces/many-to-many/use-relation';
import useSelection from '@/interfaces/many-to-many/use-selection';
import usePreview from '@/interfaces/many-to-many/use-preview';
import useEdit from '@/interfaces/many-to-many/use-edit';
import useSort from '@/interfaces/many-to-many/use-sort';

export default defineComponent({
	components: { DrawerCollection, DrawerItem },
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
		const { collection, field, value } = toRefs(props);

		const { junction, junctionCollection, relation, relationInfo } = useRelation(collection, field);

		function emitter(newVal: any[] | null) {
			emit('input', newVal);
		}

		const { deleteItem, getUpdatedItems, getNewItems, getPrimaryKeys, getNewSelectedItems } = useActions(
			value,
			relationInfo,
			emitter
		);

		const fields = computed(() => {
			const { junctionField } = relationInfo.value;
			return ['id', 'type', 'title'].map((key) => `${junctionField}.${key}`);
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
				value: relationInfo.value.junctionField + '.' + 'title',
				align: 'left',
				sortable: true,
				width: 250,
			},
		]);

		const { loading, error, items } = usePreview(
			value,
			fields,
			relationInfo,
			getNewSelectedItems,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys
		);

		const {
			cancelEdit,
			stageEdits,
			editsAtStart,
			editItem,
			currentlyEditing,
			editModalActive,
			relatedPrimaryKey,
		} = useEdit(value, relationInfo, emitter);

		const { stageSelection, selectModalActive, selectionFilters } = useSelection(value, items, relationInfo, emitter);

		const { showUpload, onUpload } = useUpload();

		const { sort, sortItems, sortedItems } = useSort(relationInfo, fields, items, emitter);

		return {
			junction,
			relation,
			tableHeaders,
			junctionCollection,
			loading,
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
			relationInfo,
			editItem,
			editModalActive,
			relatedPrimaryKey,
			sort,
			sortItems,
			sortedItems,
			downloadItem,
		};

		function downloadItem(item: any) {
			const filePath = addTokenToURL(getRootPath() + `assets/${item.directus_files_id.id}?download`);
			window.open(filePath, '_blank');
		}

		function useUpload() {
			const showUpload = ref(false);

			return { showUpload, onUpload };

			function onUpload(files: Record<string, any>[]) {
				showUpload.value = false;

				if (files.length === 0) return;

				const { junctionField } = relationInfo.value;

				const filesAsJunctionRows = files.map((file) => {
					return {
						[junctionField]: file.id,
					};
				});

				emit('input', [...(props.value || []), ...filesAsJunctionRows]);
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
.download {
	--v-icon-color: var(--foreground-subdued);

	margin-right: 8px;
}

.deselect {
	--v-icon-color: var(--foreground-subdued);
	--v-icon-color-hover: var(--danger);
}
</style>
