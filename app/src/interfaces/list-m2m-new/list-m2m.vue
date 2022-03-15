<template>
	<v-notice v-if="!relationInfo" type="warning">
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
					<v-list-item :dense="displayItems.length > 4" block clickable @click="editItem(element)">
						<v-icon v-if="allowDrag" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />
						<render-template
							:collection="relationInfo.junctionCollection.collection"
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
			<v-button v-if="enableCreate && createAllowed" @click="createItem">{{ t('create_new') }}</v-button>
			<v-button v-if="enableSelect && updateAllowed" @click="selectModalActive = true">
				{{ t('add_existing') }}
			</v-button>
		</div>

		<drawer-item
			v-if="!disabled"
			:active="editModalActive"
			:collection="relationInfo.junctionCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:related-primary-key="relatedPrimaryKey || '+'"
			:junction-field="relationInfo.junctionField.field"
			:edits="editsAtStart"
			:circular-field="relationInfo.reverseJunctionField.field"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="relationInfo.relatedCollection.collection"
			:selection="selectedPrimaryKeys"
			:filter="customFilter"
			multiple
			@input="stageSelections"
		/>
	</div>
</template>

<script setup lang="ts">
import { useRelationM2M, useRelationMultiple, RelationQueryMultiple, DisplayItem } from '@/composables/use-relation';
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
import { isEmpty, clamp, get } from 'lodash';
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
const { relationInfo } = useRelationM2M(collection, field);

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

const { create, update, remove, displayItems, totalItemCount, loading, selected } = useRelationMultiple(
	value,
	query,
	relationInfo,
	primaryKey
);

const pageCount = computed(() => Math.ceil(totalItemCount.value / limit.value));

const allowDrag = computed(
	() => totalItemCount.value <= limit.value && relationInfo.value?.sortField !== undefined && !props.disabled
);

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

const editModalActive = ref(false);
const currentlyEditing = ref<string | number | null>(null);
const relatedPrimaryKey = ref<string | number | null>(null);
const selectModalActive = ref(false);
const editsAtStart = ref<Record<string, any>>({});
let newItem = false;

function createItem() {
	currentlyEditing.value = null;
	relatedPrimaryKey.value = null;
	editsAtStart.value = {};
	newItem = true;
	editModalActive.value = true;
}

function editItem(item: DisplayItem) {
	if (!relationInfo.value) return;

	const relationPkField = relationInfo.value.relatedPrimaryKeyField.field;
	const junctionPkField = relationInfo.value.junctionPrimaryKeyField.field;

	newItem = false;
	editsAtStart.value = item;

	editModalActive.value = true;

	if (item?.$type === 'created') {
		currentlyEditing.value = null;
		relatedPrimaryKey.value = null;
	} else {
		currentlyEditing.value = get(item, [junctionPkField], null);
		relatedPrimaryKey.value = get(item, [junctionPkField, relationPkField], null);
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
	editModalActive.value = true;
}

function stageSelections(items: (string | number)[]) {
	const selected = items.map((item) => {
		if (!relationInfo.value) return {};

		return {
			[relationInfo.value.relatedPrimaryKeyField.field]: item,
			[relationInfo.value.reverseJunctionField.field]: props.primaryKey,
		};
	});
	update(...selected);
}

function deleteItem(item: DisplayItem) {
	if (
		page.value === Math.ceil(totalItemCount.value / limit.value) &&
		page.value !== Math.ceil((totalItemCount.value - 1) / limit.value)
	) {
		page.value = Math.max(0, page.value - 1);
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

	filter._and.push(selectFilter);

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
