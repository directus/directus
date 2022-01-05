<template>
	<v-notice v-if="!junction || !relation" type="warning">
		{{ t('relationship_not_setup') }}
	</v-notice>
	<div v-else class="many-to-many">
		<template v-if="loading">
			<v-skeleton-loader
				v-for="n in (value || []).length || 3"
				:key="n"
				:type="(value || []).length > 4 ? 'block-list-item-dense' : 'block-list-item'"
			/>
		</template>

		<v-notice v-else-if="sortedItems.length === 0">
			{{ t('no_items') }}
		</v-notice>

		<v-list v-else>
			<draggable
				:force-fallback="true"
				:model-value="sortedItems"
				item-key="id"
				handle=".drag-handle"
				:disabled="!junction.meta.sort_field"
				@update:model-value="sortItems($event)"
			>
				<template #item="{ element }">
					<v-list-item :dense="sortedItems.length > 4" block clickable @click="editItem(element)">
						<v-icon
							v-if="junction.meta.sort_field"
							name="drag_handle"
							class="drag-handle"
							left
							@click.stop="() => {}"
						/>
						<render-template
							:collection="junctionCollection.collection"
							:item="element"
							:template="templateWithDefaults"
						/>
						<div class="spacer" />
						<v-icon v-if="!disabled" name="close" @click.stop="deleteItem(element)" />
					</v-list-item>
				</template>
			</draggable>
		</v-list>

		<div v-if="!disabled" class="actions">
			<v-button v-if="enableCreate && createAllowed" @click="showUpload = true">{{ t('upload_file') }}</v-button>
			<v-button v-if="enableSelect && selectAllowed" @click="selectModalActive = true">
				{{ t('add_existing') }}
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
			:circular-field="junction.field"
			@input="stageEdits"
			@update:active="cancelEdit"
		>
			<template #actions>
				<v-button
					v-if="currentlyEditing !== '+' && relationCollection.collection === 'directus_files'"
					secondary
					rounded
					icon
					download
					:href="downloadUrl"
				>
					<v-icon name="download" />
				</v-button>
			</template>
		</drawer-item>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="relationCollection.collection"
			:selection="selectedPrimaryKeys"
			multiple
			@input="stageSelection"
		/>

		<v-dialog v-if="!disabled" v-model="showUpload">
			<v-card>
				<v-card-title>{{ t('upload_file') }}</v-card-title>
				<v-card-text>
					<v-upload multiple from-url :folder="folder" @input="onUpload" />
				</v-card-text>
				<v-card-actions>
					<v-button @click="showUpload = false">{{ t('done') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, PropType, toRefs, ref } from 'vue';
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import { get } from 'lodash';
import Draggable from 'vuedraggable';

import useActions from '../list-m2m/use-actions';
import useRelation from '@/composables/use-m2m';
import usePreview from '../list-m2m/use-preview';
import useEdit from '../list-m2m/use-edit';
import useSelection from '../list-m2m/use-selection';
import useSort from '../list-m2m/use-sort';
import usePermissions from '../list-m2m/use-permissions';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { getRootPath } from '@/utils/get-root-path';
import { addTokenToURL } from '@/api';

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
		enableCreate: {
			type: Boolean,
			default: true,
		},
		enableSelect: {
			type: Boolean,
			default: true,
		},
		folder: {
			type: String,
			default: undefined,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const { value, collection, field } = toRefs(props);

		const { junction, junctionCollection, relation, relationCollection, relationInfo } = useRelation(collection, field);

		const templateWithDefaults = computed(() => {
			if (props.template) return props.template;
			if (junctionCollection.value.meta?.display_template) return junctionCollection.value.meta.display_template;

			let relatedDisplayTemplate = relationCollection.value.meta?.display_template;
			if (relatedDisplayTemplate) {
				const regex = /({{.*?}})/g;
				const parts = relatedDisplayTemplate.split(regex).filter((p) => p);

				for (const part of parts) {
					if (part.startsWith('{{') === false) continue;
					const key = part.replace(/{{/g, '').replace(/}}/g, '').trim();
					const newPart = `{{${relation.value.field}.${key}}}`;

					relatedDisplayTemplate = relatedDisplayTemplate.replace(part, newPart);
				}

				return relatedDisplayTemplate;
			}

			return `{{${relation.value.field}.${relationInfo.value.relationPkField}}}`;
		});

		const fields = computed(() =>
			adjustFieldsForDisplays(getFieldsFromTemplate(templateWithDefaults.value), junctionCollection.value.collection)
		);

		const { deleteItem, getUpdatedItems, getNewItems, getPrimaryKeys, getNewSelectedItems } = useActions(
			value,
			relationInfo,
			emitter
		);

		const { tableHeaders, items, initialItems, loading } = usePreview(
			value,
			fields,
			relationInfo,
			getNewSelectedItems,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys
		);

		const { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit, relatedPrimaryKey, editModalActive } =
			useEdit(value, relationInfo, emitter);

		const { stageSelection, selectModalActive, selectedPrimaryKeys } = useSelection(
			items,
			initialItems,
			relationInfo,
			emitter
		);
		const { sort, sortItems, sortedItems } = useSort(relationInfo, fields, items, emitter);

		const { createAllowed, selectAllowed } = usePermissions(junctionCollection, relationCollection);

		const { showUpload, onUpload } = useUpload();

		const downloadUrl = computed(() => {
			if (relatedPrimaryKey.value === null || relationCollection.value.collection !== 'directus_files') return;
			return addTokenToURL(getRootPath() + `assets/${relatedPrimaryKey.value}`);
		});

		return {
			t,
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
			selectedPrimaryKeys,
			items,
			relationInfo,
			relatedPrimaryKey,
			get,
			editModalActive,
			sort,
			sortItems,
			sortedItems,
			templateWithDefaults,
			createAllowed,
			selectAllowed,
			onUpload,
			showUpload,
			downloadUrl,
		};

		function emitter(newVal: any[] | null) {
			emit('input', newVal);
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
.v-list {
	--v-list-padding: 0 0 4px;
}

.actions {
	margin-top: 8px;

	.v-button + .v-button {
		margin-left: 8px;
	}
}

.deselect {
	--v-icon-color: var(--foreground-subdued);

	&:hover {
		--v-icon-color: var(--danger);
	}
}
</style>
