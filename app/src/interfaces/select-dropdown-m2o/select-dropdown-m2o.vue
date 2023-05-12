<template>
	<v-notice v-if="!relationInfo" type="warning">
		{{ t('relationship_not_setup') }}
	</v-notice>
	<v-notice v-else-if="relationInfo.relatedCollection.meta?.singleton" type="warning">
		{{ t('no_singleton_relations') }}
	</v-notice>
	<v-notice v-else-if="!displayTemplate" type="warning">
		{{ t('display_template_not_setup') }}
	</v-notice>
	<v-notice v-else-if="!enableCreate && !enableSelect && !displayItem">
		{{ t('no_items') }}
	</v-notice>
	<div v-else class="many-to-one">
		<v-skeleton-loader v-if="loading" type="input" />
		<v-input
			v-else
			clickable
			:placeholder="t(enableSelect ? 'select_an_item' : 'create_item')"
			:disabled="disabled"
			@click="onPreviewClick"
		>
			<template v-if="displayItem" #input>
				<div class="preview">
					<render-template
						:collection="relationInfo.relatedCollection.collection"
						:item="displayItem"
						:template="displayTemplate"
					/>
				</div>
			</template>

			<template #append>
				<template v-if="displayItem">
					<v-icon v-tooltip="t('edit')" name="open_in_new" class="edit" @click="editModalActive = true" />
					<v-icon
						v-if="!disabled"
						v-tooltip="t('deselect')"
						name="close"
						class="deselect"
						@click.stop="$emit('input', null)"
					/>
				</template>
				<template v-else>
					<v-icon
						v-if="createAllowed && enableCreate"
						v-tooltip="t('create_item')"
						class="add"
						name="add"
						@click="editModalActive = true"
					/>
					<v-icon v-if="enableSelect" class="expand" name="expand_more" />
				</template>
			</template>
		</v-input>

		<drawer-item
			v-model:active="editModalActive"
			:collection="relationInfo.relatedCollection.collection"
			:primary-key="currentPrimaryKey"
			:edits="edits"
			:circular-field="relationInfo.relation.meta?.one_field ?? undefined"
			:disabled="!updateAllowed || disabled"
			@input="onDrawerItemInput"
		/>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="relationInfo.relatedCollection.collection"
			:selection="selection"
			:filter="customFilter"
			@input="onSelection"
		/>
	</div>
</template>

<script setup lang="ts">
import { useRelationM2O } from '@/composables/use-relation-m2o';
import { useRelationPermissionsM2O } from '@/composables/use-relation-permissions';
import { RelationQuerySingle, useRelationSingle } from '@/composables/use-relation-single';
import { useCollectionsStore } from '@/stores/collections';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { parseFilter } from '@/utils/parse-filter';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import { Filter } from '@directus/types';
import { deepMap, getFieldsFromTemplate } from '@directus/utils';
import { get } from 'lodash';
import { render } from 'micromustache';
import { computed, inject, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		value?: number | string | Record<string, any> | null;
		collection: string;
		field: string;
		template?: string | null;
		selectMode?: 'auto' | 'dropdown' | 'modal';
		disabled?: boolean;
		filter?: Filter | null;
		enableCreate?: boolean;
		enableSelect?: boolean;
	}>(),
	{
		value: () => null,
		selectMode: 'auto',
		disabled: false,
		template: () => null,
		filter: () => null,
		enableCreate: true,
		enableSelect: true,
	}
);

const emit = defineEmits(['input']);

const values = inject('values', ref<Record<string, any>>({}));

const collectionsStore = useCollectionsStore();

const customFilter = computed(() => {
	return parseFilter(
		deepMap(props.filter, (val: any) => {
			if (val && typeof val === 'string') {
				return render(val, values.value);
			}

			return val;
		})
	);
});

const { t } = useI18n();
const { collection, field } = toRefs(props);
const { relationInfo } = useRelationM2O(collection, field);

const value = computed({
	get: () => props.value ?? null,
	set: (value) => {
		emit('input', value);
	},
});

const selectModalActive = ref(false);
const editModalActive = ref(false);

const displayTemplate = computed(() => {
	if (props.template) return props.template;

	if (!relationInfo.value) return '';

	const displayTemplate = collectionsStore.getCollection(relationInfo.value.relatedCollection.collection)?.meta
		?.display_template;

	return displayTemplate || `{{ ${relationInfo.value.relatedPrimaryKeyField.field || ''} }}`;
});

const requiredFields = computed(() => {
	if (!displayTemplate.value || !relationInfo.value?.relatedCollection.collection) return [];

	return adjustFieldsForDisplays(
		getFieldsFromTemplate(displayTemplate.value),
		relationInfo.value?.relatedCollection.collection
	);
});

const query = computed<RelationQuerySingle>(() => ({
	fields: requiredFields.value,
}));

const { update, remove, displayItem, loading } = useRelationSingle(value, query, relationInfo);
const { createAllowed, updateAllowed } = useRelationPermissionsM2O(relationInfo);

const currentPrimaryKey = computed<string | number>(() => {
	if (!displayItem.value || !props.value || !relationInfo.value) return '+';

	if (typeof props.value === 'number' || typeof props.value === 'string') {
		return props.value;
	}

	return get(props.value, relationInfo.value.relatedPrimaryKeyField.field, '+');
});

const edits = computed(() => {
	if (!props.value || typeof props.value !== 'object') return {};

	return props.value;
});

function onPreviewClick() {
	if (props.disabled) return;

	// Prevent double dialog in case the edit dialog is already open
	if (editModalActive.value === true) return;

	if (props.enableSelect) {
		selectModalActive.value = true;
		return;
	}

	editModalActive.value = true;
}

function onDrawerItemInput(event: any) {
	if (props.disabled) return;
	update(event);
}

const selection = computed<(number | string)[]>(() => {
	const pkField = relationInfo.value?.relatedPrimaryKeyField.field;

	if (!props.value || !pkField) return [];

	if (typeof props.value === 'object' && pkField in props.value) {
		return [props.value[pkField]];
	}

	return [props.value];
});

function onSelection(selection: (number | string)[] | null) {
	if (selection!.length === 0) {
		remove();
	} else {
		update(selection![0]);
	}

	selectModalActive.value = false;
}
</script>

<style lang="scss" scoped>
.many-to-one {
	position: relative;

	:deep(.v-input .append) {
		display: flex;
	}
}

.v-skeleton-loader {
	top: 0;
	left: 0;
}

.preview {
	display: block;
	flex-grow: 1;
	height: calc(100% - 16px);
	overflow: hidden;
}

.expand {
	transition: transform var(--fast) var(--transition);

	&.active {
		transform: scaleY(-1);
	}
}

.edit {
	margin-right: 4px;

	&:hover {
		--v-icon-color: var(--foreground-normal);
	}
}

.add:hover {
	--v-icon-color: var(--primary);
}

.deselect:hover {
	--v-icon-color: var(--danger);
}
</style>
