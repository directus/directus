<template>
	<v-notice v-if="!relationInfo" type="warning">
		{{ t('relationship_not_setup') }}
	</v-notice>
	<v-notice v-else-if="!displayTemplate" type="warning">
		{{ t('display_template_not_setup') }}
	</v-notice>
	<div v-else class="many-to-one">
		<v-skeleton-loader v-if="loading" type="input" />
		<v-input v-else clickable :placeholder="t('select_an_item')" :disabled="disabled" @click="onPreviewClick">
			<template v-if="displayItem" #input>
				<div class="preview">
					<render-template
						:collection="relationInfo.relatedCollection.collection"
						:item="displayItem"
						:template="displayTemplate"
					/>
				</div>
			</template>

			<template v-if="!disabled" #append>
				<template v-if="displayItem">
					<v-icon
						v-if="updateAllowed"
						v-tooltip="t('edit')"
						name="open_in_new"
						class="edit"
						@click.stop="editModalActive = true"
					/>
					<v-icon v-tooltip="t('deselect')" name="close" class="deselect" @click.stop="$emit('input', null)" />
				</template>
				<template v-else>
					<v-icon
						v-if="createAllowed"
						v-tooltip="t('create_item')"
						class="add"
						name="add"
						@click.stop="editModalActive = true"
					/>
					<v-icon class="expand" name="expand_more" />
				</template>
			</template>
		</v-input>

		<drawer-item
			v-if="!disabled"
			v-model:active="editModalActive"
			:collection="relationInfo.relatedCollection.collection"
			:primary-key="currentPrimaryKey"
			:edits="edits"
			:circular-field="relationInfo.relation.meta?.one_field ?? undefined"
			@input="update"
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
import { useRelationM2O, useRelationSingle, RelationQuerySingle } from '@/composables/use-relation';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { useCollection } from '@directus/shared/composables';
import { Filter } from '@directus/shared/types';
import { deepMap, getFieldsFromTemplate } from '@directus/shared/utils';
import { get } from 'lodash';
import { computed, inject, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import { parseFilter } from '@/utils/parse-filter';
import { render } from 'micromustache';
import { usePermissionsStore } from '@/stores';

const props = withDefaults(
	defineProps<{
		value?: number | string | Record<string, any> | null;
		collection: string;
		field: string;
		template?: string | null;
		selectMode?: 'auto' | 'dropdown' | 'modal';
		disabled?: boolean;
		filter?: Filter | null;
	}>(),
	{
		value: () => null,
		selectMode: 'auto',
		disabled: false,
		template: () => null,
		filter: () => null,
	}
);

const emit = defineEmits(['input']);

const values = inject('values', ref<Record<string, any>>({}));

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

const { info: collectionInfo } = useCollection(collection);

const displayTemplate = computed(() => {
	if (props.template) return props.template;
	return (
		collectionInfo.value?.meta?.display_template || `{{ ${relationInfo.value?.relatedPrimaryKeyField.field || ''} }}`
	);
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

	selectModalActive.value = true;
}

const selection = computed<(number | string)[]>(() => {
	const pkField = relationInfo.value?.relatedPrimaryKeyField.field;

	if (!props.value || !pkField) return [];

	if (typeof props.value === 'object' && pkField in props.value) {
		return [props.value[pkField]];
	}
	return [props.value];
});

function onSelection(selection: (number | string)[]) {
	if (selection.length === 0) {
		remove();
	} else {
		update(selection[0]);
	}

	selectModalActive.value = false;
}

const { hasPermission } = usePermissionsStore();

const createAllowed = computed(() => {
	if (!relationInfo.value) return false;
	return hasPermission(relationInfo.value.relatedCollection.collection, 'create');
});

const updateAllowed = computed(() => {
	if (!relationInfo.value) return false;
	return hasPermission(relationInfo.value.relatedCollection.collection, 'update');
});
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
