<template>
	<v-notice type="warning" v-if="!junction || !relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div class="many-to-many" v-else>
		<template v-if="loading">
			<v-skeleton-loader
				v-for="n in (value || []).length || 3"
				:key="n"
				:type="(value || []).length > 4 ? 'block-list-item-dense' : 'block-list-item'"
			/>
		</template>

		<v-notice v-else-if="sortedItems.length === 0">
			{{ $t('no_items') }}
		</v-notice>

		<v-list v-else>
			<draggable
				:force-fallback="true"
				:value="sortedItems"
				@input="sortItems($event)"
				handler=".drag-handle"
				:disabled="!junction.sort_field"
			>
				<v-list-item
					:dense="sortedItems.length > 4"
					v-for="item in sortedItems"
					:key="item.id"
					block
					@click="editItem(item)"
				>
					<v-icon v-if="junction.sort_field" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />
					<render-template :collection="junctionCollection.collection" :item="item" :template="templateWithDefaults" />
					<div class="spacer" />
					<v-icon v-if="!disabled" name="close" @click.stop="deleteItem(item)" />
				</v-list-item>
			</draggable>
		</v-list>

		<div class="actions" v-if="!disabled">
			<v-button v-if="enableCreate && createAllowed" @click="editModalActive = true">{{ $t('create_new') }}</v-button>
			<v-button v-if="enableSelect && selectAllowed" @click="selectModalActive = true">
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
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { usePermissionsStore, useUserStore } from '@/stores';
import { DisplayConfig } from '@/displays/types';

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
	},
	setup(props, { emit }) {
		const permissionsStore = usePermissionsStore();
		const userStore = useUserStore();

		const { value, collection, field } = toRefs(props);

		const { junction, junctionCollection, relation, relationCollection, relationInfo } = useRelation(collection, field);

		const templateWithDefaults = computed(() => {
			if (props.template) return props.template;
			if (junctionCollection.value.meta?.display_template) return junctionCollection.value.meta.display_template;

			let relatedDisplayTemplate = relationCollection.value.meta?.display_template;
			if (relatedDisplayTemplate) {
				const regex = /({{.*?}})/g;
				const parts = relatedDisplayTemplate.split(regex).filter((p: DisplayConfig) => p);

				for (const part of parts) {
					if (part.startsWith('{{') === false) continue;
					const key = part.replace(/{{/g, '').replace(/}}/g, '').trim();
					const newPart = `{{${relation.value.many_field}.${key}}}`;

					relatedDisplayTemplate = relatedDisplayTemplate.replace(part, newPart);
				}

				return relatedDisplayTemplate;
			}

			return `{{${relation.value.many_field}.${relationInfo.value.relationPkField}}}`;
		});

		const fields = computed(() =>
			adjustFieldsForDisplays(getFieldsFromTemplate(templateWithDefaults.value), junctionCollection.value.collection)
		);

		const { deleteItem, getUpdatedItems, getNewItems, getPrimaryKeys, getNewSelectedItems } = useActions(
			value,
			relationInfo,
			emitter
		);

		const { tableHeaders, items, loading } = usePreview(
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

		const { createAllowed, selectAllowed } = usePermissions();

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
			createAllowed,
			selectAllowed,
		};

		function emitter(newVal: any[] | null) {
			emit('input', newVal);
		}

		function usePermissions() {
			const createAllowed = computed(() => {
				const admin = userStore.state?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const hasJunctionPermissions = !!permissionsStore.state.permissions.find(
					(permission) =>
						permission.action === 'create' && permission.collection === junctionCollection.value.collection
				);

				const hasRelatedPermissions = !!permissionsStore.state.permissions.find(
					(permission) =>
						permission.action === 'create' && permission.collection === relationCollection.value.collection
				);

				return hasJunctionPermissions && hasRelatedPermissions;
			});

			const selectAllowed = computed(() => {
				const admin = userStore.state?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const hasJunctionPermissions = !!permissionsStore.state.permissions.find(
					(permission) =>
						permission.action === 'create' && permission.collection === junctionCollection.value.collection
				);

				return hasJunctionPermissions;
			});

			return { createAllowed, selectAllowed };
		}
	},
});
</script>

<style lang="scss" scoped>
.v-list {
	--v-list-padding: 0 0 4px;
}

.actions {
	margin-top: 12px;

	.v-button + .v-button {
		margin-left: 12px;
	}
}

.deselect {
	--v-icon-color: var(--foreground-subdued);

	&:hover {
		--v-icon-color: var(--danger);
	}
}
</style>
