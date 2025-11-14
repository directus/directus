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
import { getItemRoute } from '@/utils/get-route';

const props = withDefaults(
	defineProps<{
		value?: number | string | Record<string, any> | null;
		collection: string;
		field: string;
		template?: string | null;
		selectMode?: 'auto' | 'dropdown' | 'modal';
		disabled?: boolean;
		nonEditable?: boolean;
		filter?: Filter | null;
		enableCreate?: boolean;
		enableSelect?: boolean;
		loading?: boolean;
		enableLink?: boolean;
	}>(),
	{
		value: null,
		selectMode: 'auto',
		disabled: false,
		nonEditable: false,
		template: null,
		filter: null,
		enableCreate: true,
		enableSelect: true,
		enableLink: false,
	},
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
		}),
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
		relationInfo.value?.relatedCollection.collection,
	);
});

const query = computed<RelationQuerySingle>(() => ({
	fields: requiredFields.value,
}));

const { update, remove, displayItem, loading } = useRelationSingle(value, query, relationInfo, {
	enabled: computed(() => !props.loading),
});

const { createAllowed } = useRelationPermissionsM2O(relationInfo);

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
	if (selection) {
		if (selection[0]) {
			update(selection[0]);
		} else {
			remove();
		}
	}

	selectModalActive.value = false;
}

function getLinkForItem() {
	if (!collection.value || !currentPrimaryKey.value || !relationInfo.value) return '';
	return getItemRoute(relationInfo.value.relatedCollection.collection, currentPrimaryKey.value);
}
</script>

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

		<v-list-item v-else block clickable :disabled="disabled" :non-editable="nonEditable" @click="onPreviewClick">
			<div v-if="displayItem" class="preview">
				<render-template
					:collection="relationInfo.relatedCollection.collection"
					:item="displayItem"
					:template="displayTemplate"
				/>
			</div>
			<div v-else class="placeholder">{{ t(enableSelect ? 'select_an_item' : 'create_item') }}</div>

			<div class="spacer" />

			<div class="item-actions">
				<template v-if="displayItem">
					<router-link
						v-if="enableLink"
						v-tooltip="t('navigate_to_item')"
						:to="getLinkForItem()"
						class="item-link"
						@click.stop
					>
						<v-icon name="launch" />
					</router-link>

					<v-icon
						v-if="!disabled || nonEditable"
						v-tooltip="t('edit_item')"
						name="edit"
						clickable
						@click="editModalActive = true"
					/>

					<v-remove
						v-if="!disabled"
						deselect
						:item-info="relationInfo"
						:item-edits="edits"
						@action="$emit('input', null)"
					/>
				</template>

				<template v-else>
					<v-icon
						v-if="!disabled && createAllowed && enableCreate"
						v-tooltip="t('create_item')"
						class="add"
						name="add"
						clickable
						@click="editModalActive = true"
					/>

					<v-icon v-if="enableSelect" class="expand" name="expand_more" />
				</template>
			</div>
		</v-list-item>

		<drawer-item
			v-model:active="editModalActive"
			:collection="relationInfo.relatedCollection.collection"
			:primary-key="currentPrimaryKey"
			:edits="edits"
			:circular-field="relationInfo.relation.meta?.one_field ?? undefined"
			:disabled="disabled"
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

<style lang="scss" scoped>
@use '@/styles/mixins';

.item-actions {
	@include mixins.list-interface-item-actions($item-link: true);

	.add:hover {
		--v-icon-color: var(--theme--primary);
	}
}

.many-to-one {
	position: relative;
}

.v-list-item {
	&:focus-within,
	&:focus-visible {
		--v-list-item-border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus));
		--v-list-item-border-color-hover: var(--v-list-item-border-color);

		offset: 0;
		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}
}

.v-skeleton-loader {
	inset-block-start: 0;
	inset-inline-start: 0;
}

.placeholder {
	color: var(--v-input-placeholder-color, var(--theme--foreground-subdued));
}

.preview {
	flex-grow: 1;
	block-size: 100%;
	overflow: hidden;
}

.expand {
	transition: transform var(--fast) var(--transition);

	&.active {
		transform: scaleY(-1);
	}
}
</style>
