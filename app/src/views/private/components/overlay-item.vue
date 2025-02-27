<script setup lang="ts">
import api from '@/api';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { usePermissions } from '@/composables/use-permissions';
import { useTemplateData } from '@/composables/use-template-data';
import { useNestedValidation } from '@/composables/use-nested-validation';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { validateItem } from '@/utils/validate-item';
import { useCollection } from '@directus/composables';
import { isSystemCollection } from '@directus/system-data';
import { Field, PrimaryKey, Relation } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { isEmpty, merge, set } from 'lodash';
import { Ref, computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import OverlayItemContent from './overlay-item-content.vue';

export interface OverlayItemProps {
	overlay?: 'drawer' | 'popover';
	collection: string;
	active?: boolean;
	primaryKey?: PrimaryKey | null;
	edits?: Record<string, any>;
	junctionField?: string | null;
	disabled?: boolean;
	// There's an interesting case where the main form can be a newly created item ('+'), while
	// it has a pre-selected related item it needs to alter. In that case, we have to fetch the
	// related data anyway.
	relatedPrimaryKey?: PrimaryKey;
	// If this drawer-item is opened from a relational interface, we need to force-block the field
	// that relates back to the parent item.
	circularField?: string | null;
	junctionFieldLocation?: string;
	selectedFields?: string[] | null;
}

export interface OverlayItemEmits {
	'update:active': [value: boolean];
	input: [value: Record<string, any>];
}

const props = withDefaults(defineProps<OverlayItemProps>(), {
	overlay: 'drawer',
	primaryKey: null,
	junctionField: null,
	disabled: false,
	relatedPrimaryKey: '+',
	circularField: null,
});

const emit = defineEmits<OverlayItemEmits>();

const { t, te } = useI18n();

const validationErrors = ref<any[]>([]);

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const { internalActive } = useActiveState();

const { junctionFieldInfo, relatedCollection, relatedCollectionInfo, relatedPrimaryKeyField } = useRelation();

const { internalEdits, loading, initialValues, refresh } = useItem();
const { save, cancel, overlayActive } = useActions();

const { collection, primaryKey, relatedPrimaryKey } = toRefs(props);

const { info: collectionInfo, primaryKeyField } = useCollection(collection);

const isNew = computed(() => props.primaryKey === '+' && props.relatedPrimaryKey === '+');

const hasEdits = computed(() => !isEmpty(internalEdits.value));
const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);
const router = useRouter();

function discardAndLeave() {
	if (!leaveTo.value) return;
	internalEdits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}

const title = computed(() => {
	const collection = relatedCollectionInfo?.value || collectionInfo.value!;

	if (te(`collection_names_singular.${collection.collection}`)) {
		return isNew.value
			? t('creating_unit', {
					unit: t(`collection_names_singular.${collection.collection}`),
			  })
			: t('editing_unit', {
					unit: t(`collection_names_singular.${collection.collection}`),
			  });
	}

	return isNew.value
		? t('creating_in', { collection: collection.name })
		: t('editing_in', { collection: collection.name });
});

const {
	itemPermissions: { fields: fieldsWithPermissions, saveAllowed },
} = usePermissions(
	collection,
	primaryKey,
	computed(() => props.primaryKey === '+'),
);

const {
	itemPermissions: { fields: relatedCollectionFields, saveAllowed: saveRelatedCollectionAllowed },
} = usePermissions(
	relatedCollection as Ref<string>,
	relatedPrimaryKey,
	computed(() => props.relatedPrimaryKey === '+'),
);

const fields = computed(() => {
	const availableFields = fieldsWithPermissions.value.map((field: Field) => {
		if (props.circularField && field.field === props.circularField) set(field, 'meta.readonly', true);
		return field;
	});

	if (!props.selectedFields?.length) return availableFields;

	const selectedFieldNames = availableFields.filter((field) => props.selectedFields!.includes(field.field));

	return selectedFieldNames.length ? selectedFieldNames : availableFields;
});

const fieldsWithoutCircular = computed(() => {
	if (props.circularField) {
		return fields.value.filter((field) => {
			return field.field !== props.circularField;
		});
	} else {
		return fields.value;
	}
});

const templatePrimaryKey = computed(() =>
	junctionFieldInfo.value ? String(props.relatedPrimaryKey) : String(props.primaryKey),
);

const templateCollection = computed(() => relatedCollectionInfo.value || collectionInfo.value);

const isSavable = computed(() => {
	if (props.disabled) return false;
	if (!relatedCollection.value) return saveAllowed.value;
	return saveAllowed.value || saveRelatedCollectionAllowed.value;
});

const {
	template,
	templateData,
	loading: templateDataLoading,
} = useTemplateData(templateCollection, templatePrimaryKey);

function useActiveState() {
	const localActive = ref(false);

	const internalActive = computed({
		get() {
			return props.active ?? localActive.value;
		},
		set(newActive: boolean) {
			localActive.value = newActive;
			emit('update:active', newActive);
		},
	});

	return { internalActive };
}

function useItem() {
	const internalEdits = ref<Record<string, any>>({});
	const loading = ref(false);
	const initialValues = ref<Record<string, any> | null>(null);

	watch(
		() => props.active,
		(isActive) => {
			if (isActive) {
				if (props.primaryKey !== '+') fetchItem();
				if (props.relatedPrimaryKey !== '+') fetchRelatedItem();
				internalEdits.value = props.edits ?? {};
			} else {
				loading.value = false;
				initialValues.value = null;
				internalEdits.value = {};
			}
		},
		{ immediate: true },
	);

	return { internalEdits, loading, initialValues, refresh };

	async function refresh() {
		if (props.active) {
			loading.value = false;
			if (props.primaryKey !== '+') fetchItem();
			if (props.relatedPrimaryKey !== '+') fetchRelatedItem();
		}
	}

	async function fetchItem() {
		if (!props.primaryKey) return;

		loading.value = true;

		const baseEndpoint = getEndpoint(props.collection);

		const endpoint = isSystemCollection(props.collection)
			? `${baseEndpoint}/${props.primaryKey}`
			: `${baseEndpoint}/${encodeURIComponent(props.primaryKey)}`;

		let fields = '*';

		if (props.junctionField) {
			fields = `*,${props.junctionField}.*`;
		}

		try {
			const response = await api.get(endpoint, { params: { fields } });

			initialValues.value = response.data.data;
		} catch (error) {
			internalActive.value = false;
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}

	async function fetchRelatedItem() {
		const collection = relatedCollection.value;

		if (!collection || !junctionFieldInfo.value) return;

		loading.value = true;

		const baseEndpoint = getEndpoint(collection);

		const endpoint = isSystemCollection(collection)
			? `${baseEndpoint}/${props.relatedPrimaryKey}`
			: `${baseEndpoint}/${encodeURIComponent(props.relatedPrimaryKey)}`;

		try {
			const response = await api.get(endpoint);

			initialValues.value = {
				...(initialValues.value || {}),
				[junctionFieldInfo.value.field]: response.data.data,
			};
		} catch (error) {
			internalActive.value = false;
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}
}

function useRelation() {
	const junctionFieldInfo = computed(() => {
		if (!props.junctionField) return null;

		return fieldsStore.getField(props.collection, props.junctionField);
	});

	const relatedCollection = computed<string | null>(() => {
		if (!props.junctionField) return null;

		// If this is a m2m/m2a, there will be 2 relations associated with this field
		const relations = relationsStore.getRelationsForField(props.collection, props.junctionField);

		const relationForField = relations.find((relation: Relation) => {
			return relation.collection === props.collection && relation.field === props.junctionField;
		});

		if (!relationForField) return null;

		if (relationForField.related_collection) return relationForField.related_collection;

		if (relationForField.meta?.one_collection_field) {
			return (
				props.edits?.[relationForField.meta.one_collection_field] ||
				initialValues.value?.[relationForField.meta.one_collection_field]
			);
		}

		return null;
	});

	const { info: relatedCollectionInfo, primaryKeyField: relatedPrimaryKeyField } = useCollection(relatedCollection);

	return { junctionFieldInfo, relatedCollection, relatedCollectionInfo, relatedPrimaryKeyField };
}

function useActions() {
	const { nestedValidationErrors, resetNestedValidationErrors } = useNestedValidation();

	watch(internalActive, (active) => {
		if (!active) resetNestedValidationErrors();
	});

	const overlayActive = computed({
		get() {
			return internalActive.value;
		},
		set(newActive: boolean) {
			if (newActive) internalActive.value = true;
			else cancel();
		},
	});

	return { save, cancel, overlayActive };

	function save() {
		const editsToValidate = props.junctionField ? internalEdits.value[props.junctionField] : internalEdits.value;
		const fieldsToValidate = props.junctionField ? relatedCollectionFields.value : fieldsWithoutCircular.value;
		const defaultValues = getDefaultValuesFromFields(fieldsToValidate);
		const existingValues = props.junctionField ? initialValues?.value?.[props.junctionField] : initialValues?.value;

		const errors = validateItem(
			merge({}, defaultValues.value, existingValues, editsToValidate),
			fieldsToValidate,
			isNew.value,
		);

		if (nestedValidationErrors.value?.length) errors.push(...nestedValidationErrors.value);

		if (errors.length > 0) {
			validationErrors.value = errors;
			return;
		} else {
			validationErrors.value = [];
		}

		if (props.junctionField && Object.values(defaultValues.value).some((value) => value !== null)) {
			internalEdits.value[props.junctionField] = internalEdits.value[props.junctionField] ?? {};
		}

		if (props.junctionField && props.relatedPrimaryKey !== '+' && relatedPrimaryKeyField.value) {
			set(internalEdits.value, [props.junctionField, relatedPrimaryKeyField.value.field], props.relatedPrimaryKey);
		}

		if (props.primaryKey && props.primaryKey !== '+' && primaryKeyField.value) {
			internalEdits.value[primaryKeyField.value.field] = props.primaryKey;
		}

		emit('input', internalEdits.value);

		internalActive.value = false;
		internalEdits.value = {};
	}

	function cancel() {
		validationErrors.value = [];
		internalActive.value = false;
		internalEdits.value = {};
	}
}
</script>

<template>
	<v-drawer
		v-if="overlay === 'drawer'"
		v-model="overlayActive"
		:title="title"
		:icon="collectionInfo?.meta?.icon ?? undefined"
		persistent
		@cancel="cancel"
	>
		<template v-if="template !== null && templateData && primaryKey !== '+'" #title>
			<v-skeleton-loader v-if="loading || templateDataLoading" class="title-loader" type="text" />

			<h1 v-else class="type-title">
				<render-template :collection="templateCollection?.collection" :item="templateData" :template="template" />
			</h1>
		</template>

		<template #subtitle>
			<v-breadcrumb :items="[{ name: collectionInfo?.name, disabled: true }]" />
		</template>

		<template #actions>
			<slot name="actions" />

			<v-button v-tooltip.bottom="t('save')" icon rounded :disabled="!isSavable" @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<overlay-item-content
			v-model:internal-edits="internalEdits"
			:collection
			:primary-key
			:junction-field
			:related-collection
			:initial-values
			:fields
			:disabled
			:loading
			:validation-errors
			:junction-field-location
			:related-collection-fields
			:related-primary-key
			:refresh
		/>
	</v-drawer>

	<v-menu
		v-else-if="overlay === 'popover'"
		v-model="overlayActive"
		:close-on-click="false"
		:close-on-content-click="false"
		placement="top"
		show-arrow
		seamless
		keep-behind
	>
		<template #activator="activatorProps">
			<slot name="popover-activator" v-bind="activatorProps" />
		</template>

		<div class="popover-actions">
			<div class="popover-actions-inner">
				<slot name="actions" />

				<v-button v-tooltip="t('cancel')" x-small rounded icon secondary @click="cancel">
					<v-icon small name="close" outline />
				</v-button>

				<v-button v-tooltip="t('save')" x-small rounded icon :disabled="!isSavable" @click="save">
					<v-icon small name="check" outline />
				</v-button>
			</div>
		</div>

		<overlay-item-content
			v-model:internal-edits="internalEdits"
			:collection
			:primary-key
			:junction-field
			:related-collection
			:initial-values
			:fields
			:disabled
			:loading
			:validation-errors
			:junction-field-location
			:related-collection-fields
			:related-primary-key
			:refresh
			class="popover-item-content"
		/>
	</v-menu>

	<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
		<v-card>
			<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
			<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
			<v-card-actions>
				<v-button secondary @click="discardAndLeave">
					{{ t('discard_changes') }}
				</v-button>
				<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
.popover-item-content {
	--content-padding: 16px;
	--content-padding-bottom: 24px;
	--theme--form--column-gap: var(--content-padding);

	padding-top: var(--content-padding-bottom);
	position: relative;
	z-index: 0;
	width: calc(2 * var(--form-column-width) + var(--theme--form--column-gap) + 2 * var(--content-padding));
	max-width: 90vw;

	:deep(.v-form:first-child .first-visible-field .field-label),
	:deep(.v-form:first-child .first-visible-field.half + .half-right .field-label) {
		--popover-action-width: 100px; // 3 * 28 (button) + 2 * 8 (gap)

		max-width: calc(100% - var(--popover-action-width));
	}

	&.empty {
		min-height: 232px;
	}
}

.popover-actions {
	position: sticky;
	top: 0;
	left: 0;
	z-index: 1;
}

.popover-actions-inner {
	position: relative;
	display: flex;
	justify-content: right;
	gap: 8px;
	top: 12px;
	right: 16px;
}

// Puts the action buttons closer to the field
.popover-actions:has(+ .popover-item-content .v-form:first-child > .field:first-child) .popover-actions-inner {
	position: absolute;
}
</style>
