<template>
	<v-notice v-if="!relationInfo" type="warning">
		{{ t('relationship_not_setup') }}
	</v-notice>
	<div v-else class="one-to-many">
		<template v-if="loading">
			<v-skeleton-loader
				v-for="n in clamp(totalItemCount - (page - 1) * limit, 1, limit)"
				:key="n"
				:type="totalItemCount > 4 ? 'block-list-item-dense' : 'block-list-item'"
			/>
		</template>

		<v-notice v-else-if="displayItems.length === 0">
			{{ t('no_items') }}
		</v-notice>

		<v-list v-else>
			<draggable
				:force-fallback="true"
				:model-value="displayItems"
				item-key="id"
				handle=".drag-handle"
				:disabled="!allowDrag"
				@update:model-value="sortItems($event)"
			>
				<template #item="{ element }">
					<v-list-item
						block
						clickable
						:dense="totalItemCount > 4"
						:disabled="disabled || updateAllowed === false"
						:class="{ deleted: element.$type === 'deleted' }"
						@click="editItem(element)"
					>
						<v-icon v-if="allowDrag" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />
						<render-template
							:collection="relationInfo.relatedCollection.collection"
							:item="element"
							:template="templateWithDefaults"
						/>
						<div class="spacer" />
						<v-icon
							v-if="!disabled && updateAllowed"
							class="deselect"
							:name="getDeselectIcon(element)"
							@click.stop="deleteItem(element)"
						/>
					</v-list-item>
				</template>
			</draggable>
		</v-list>

		<div class="actions">
			<v-button v-if="enableCreate && createAllowed && updateAllowed" :disabled="disabled" @click="createItem">
				{{ t('create_new') }}
			</v-button>
			<v-button v-if="enableSelect && updateAllowed" :disabled="disabled" @click="selectModalActive = true">
				{{ t('add_existing') }}
			</v-button>

			<v-pagination v-if="pageCount > 1" v-model="page" :length="pageCount" :total-visible="5" />
		</div>

		<drawer-item
			:disabled="disabled"
			:active="currentlyEditing !== null"
			:collection="relationInfo.relatedCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			:circular-field="relationInfo.reverseJunctionField.field"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="relationInfo.relatedCollection.collection"
			:filter="customFilter"
			multiple
			@input="select"
		/>
	</div>
</template>

<script setup lang="ts">
import { useRelationO2M, useRelationMultiple, RelationQueryMultiple, DisplayItem } from '@/composables/use-relation';
import { parseFilter } from '@/utils/parse-filter';
import { Filter } from '@directus/shared/types';
import { deepMap, getFieldsFromTemplate } from '@directus/shared/utils';
import { render } from 'micromustache';
import { computed, inject, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import Draggable from 'vuedraggable';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { isEmpty, clamp } from 'lodash';
import { usePermissionsStore, useUserStore } from '@/stores';

const props = withDefaults(
	defineProps<{
		value?: (number | string | Record<string, any>)[] | Record<string, any>;
		primaryKey: string | number;
		collection: string;
		field: string;
		template?: string | null;
		disabled?: boolean;
		enableCreate?: boolean;
		enableSelect?: boolean;
		filter?: Filter | null;
	}>(),
	{
		value: () => [],
		template: () => null,
		disabled: false,
		enableCreate: true,
		enableSelect: true,
		filter: () => null,
	}
);

const emit = defineEmits(['input']);
const { t } = useI18n();
const { collection, field, primaryKey } = toRefs(props);
const { relationInfo } = useRelationO2M(collection, field);

const value = computed({
	get: () => props.value,
	set: (val) => {
		emit('input', val);
	},
});

const templateWithDefaults = computed(() => {
	return (
		props.template ||
		relationInfo.value?.relatedCollection.meta?.display_template ||
		`{{${relationInfo.value?.relatedPrimaryKeyField.field ?? 'id'}}}`
	);
});

const fields = computed(() =>
	adjustFieldsForDisplays(
		getFieldsFromTemplate(templateWithDefaults.value),
		relationInfo.value?.relatedCollection.collection ?? ''
	)
);

const limit = ref(15);
const page = ref(1);

const query = computed<RelationQueryMultiple>(() => ({
	fields: fields.value,
	limit: limit.value,
	page: page.value,
}));

const { create, update, remove, select, displayItems, totalItemCount, loading, selected, isItemSelected, localDelete } =
	useRelationMultiple(value, query, relationInfo, primaryKey);

const pageCount = computed(() => Math.ceil(totalItemCount.value / limit.value));

const allowDrag = computed(
	() => totalItemCount.value <= limit.value && relationInfo.value?.sortField !== undefined && !props.disabled
);

function getDeselectIcon(item: DisplayItem) {
	if (item.$type === 'deleted') return 'settings_backup_restore';
	if (localDelete(item)) return 'delete';
	return 'close';
}

function sortItems(items: DisplayItem[]) {
	const sortField = relationInfo.value?.sortField;
	if (!sortField) return;

	const sortedItems = items.map((item, index) => ({
		...item,
		[sortField]: index,
	}));
	update(...sortedItems);
}

const selectedPrimaryKeys = computed(() => {
	if (!relationInfo.value) return [];
	const pkField = relationInfo.value?.relatedPrimaryKeyField.field;

	return selected.value.map((item) => item[pkField]);
});

const currentlyEditing = ref<string | null>(null);
const selectModalActive = ref(false);
const editsAtStart = ref<Record<string, any>>({});
let newItem = false;

function createItem() {
	currentlyEditing.value = '+';
	editsAtStart.value = {};
	newItem = true;
}

function editItem(item: DisplayItem) {
	if (!relationInfo.value) return;

	const pkField = relationInfo.value.relatedPrimaryKeyField.field;

	newItem = false;
	editsAtStart.value = item;

	if (item?.$type === 'created' && !isItemSelected(item)) {
		currentlyEditing.value = '+';
	} else {
		currentlyEditing.value = item[pkField];
	}
}

function stageEdits(item: Record<string, any>) {
	if (newItem) {
		create(item);
	} else {
		update(item);
	}
}

function cancelEdit() {
	currentlyEditing.value = null;
}

function deleteItem(item: DisplayItem) {
	if (
		page.value === Math.ceil(totalItemCount.value / limit.value) &&
		page.value !== Math.ceil((totalItemCount.value - 1) / limit.value)
	) {
		page.value = Math.max(1, page.value - 1);
	}

	remove(item);
}

const values = inject('values', ref<Record<string, any>>({}));
const customFilter = computed(() => {
	const filter: Filter = {
		_and: [],
	};

	const customFilter = parseFilter(
		deepMap(props.filter, (val: any) => {
			if (val && typeof val === 'string') {
				return render(val, values.value);
			}

			return val;
		})
	);

	if (!isEmpty(customFilter)) filter._and.push(customFilter);

	if (!relationInfo.value) return filter;

	const selectFilter: Filter = {
		_or: [
			{
				[relationInfo.value.reverseJunctionField.field]: {
					_neq: props.primaryKey,
				},
			},
			{
				[relationInfo.value.reverseJunctionField.field]: {
					_null: true,
				},
			},
		],
	};

	if (selectedPrimaryKeys.value.length > 0)
		filter._and.push({
			[relationInfo.value.relatedPrimaryKeyField.field]: {
				_nin: selectedPrimaryKeys.value,
			},
		});

	if (props.primaryKey !== '+') filter._and.push(selectFilter);

	return filter;
});

const userStore = useUserStore();
const permissionsStore = usePermissionsStore();

const createAllowed = computed(() => {
	const admin = userStore.currentUser?.role.admin_access === true;
	if (admin) return true;

	return !!permissionsStore.permissions.find(
		(permission) =>
			permission.action === 'create' && permission.collection === relationInfo.value?.relatedCollection.collection
	);
});

const updateAllowed = computed(() => {
	const admin = userStore.currentUser?.role.admin_access === true;
	if (admin) return true;

	return !!permissionsStore.permissions.find(
		(permission) =>
			permission.action === 'update' && permission.collection === relationInfo.value?.relatedCollection.collection
	);
});
</script>

<style lang="scss" scoped>
.v-list {
	--v-list-padding: 0 0 4px;

	.v-list-item.deleted {
		--v-list-item-border-color: var(--danger-25);
		--v-list-item-border-color-hover: var(--danger-50);
		--v-list-item-background-color: var(--danger-10);
		--v-list-item-background-color-hover: var(--danger-25);

		::v-deep(.v-icon) {
			color: var(--danger-75);
		}
	}
}

.actions {
	margin-top: 8px;
	display: flex;
	gap: 8px;

	.v-pagination {
		margin-left: auto;

		::v-deep(.v-button) {
			display: inline-flex;
		}
	}
}

.deselect {
	--v-icon-color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		--v-icon-color: var(--danger);
	}
}
</style>
