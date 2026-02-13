<script setup lang="ts">
import { useCollection } from '@directus/composables';
import { isSystemCollection } from '@directus/system-data';
import { Field, PrimaryKey, Relation } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { isEmpty, set, uniqBy } from 'lodash';
import { computed, type Ref, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import PrivateViewHeaderBarActionButton from '../private-view/components/private-view-header-bar-action-button.vue';
import ComparisonModal from './comparison/comparison-modal.vue';
import OverlayItemContent from './overlay-item-content.vue';
import RenderTemplate from './render-template.vue';
import api from '@/api';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog, { type ApplyShortcut } from '@/components/v-dialog.vue';
import VDrawer from '@/components/v-drawer.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VMenu from '@/components/v-menu.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { useCollab } from '@/composables/use-collab';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useFlows } from '@/composables/use-flows';
import { useNestedValidation } from '@/composables/use-nested-validation';
import { usePermissions } from '@/composables/use-permissions';
import { useShortcut } from '@/composables/use-shortcut';
import { useTemplateData } from '@/composables/use-template-data';
import { useFieldsStore } from '@/stores/fields';
import { useNotificationsStore } from '@/stores/notifications';
import { useRelationsStore } from '@/stores/relations';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { mergeItemData } from '@/utils/merge-item-data';
import { translateShortcut } from '@/utils/translate-shortcut';
import { unexpectedError } from '@/utils/unexpected-error';
import { validateItem } from '@/utils/validate-item';
import CollabAvatars from '@/views/private/components/CollabAvatars.vue';
import FlowDialogs from '@/views/private/components/flow-dialogs.vue';

export interface OverlayItemProps {
	overlay?: 'drawer' | 'modal' | 'popover';
	collection: string;
	active?: boolean;
	primaryKey?: PrimaryKey | null;
	edits?: Record<string, any>;
	junctionField?: string | null;
	disabled?: boolean;
	nonEditable?: boolean;
	// There's an interesting case where the main form can be a newly created item ('+'), while
	// it has a pre-selected related item it needs to alter. In that case, we have to fetch the
	// related data anyway.
	relatedPrimaryKey?: PrimaryKey;
	// If this drawer-item is opened from a relational interface, we need to force-block the field
	// that relates back to the parent item.
	circularField?: string | null;
	junctionFieldLocation?: string;
	selectedFields?: string[] | null;
	popoverProps?: Record<string, any>;
	applyShortcut?: ApplyShortcut;
	preventCancelWithEdits?: boolean;
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
	nonEditable: false,
	relatedPrimaryKey: '+',
	circularField: null,
	applyShortcut: 'meta+enter',
});

const emit = defineEmits<OverlayItemEmits>();

const { t, te } = useI18n();

const validationErrors = ref<any[]>([]);

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const { internalActive } = useActiveState();

const { junctionFieldInfo, relatedCollection, relatedCollectionInfo, relatedPrimaryKeyField } = useRelation();

const { internalEdits, loading, initialValues, refresh } = useItem();

const { save, cancel, overlayActive, getTooltip } = useActions();

const { collection, primaryKey, relatedPrimaryKey } = toRefs(props);

const { info: collectionInfo, primaryKeyField } = useCollection(collection);

let collab: ReturnType<typeof useCollab> | undefined;
let relatedCollab: ReturnType<typeof useCollab> | undefined;

if (
	!collection.value.startsWith('directus_') &&
	(!relatedCollection.value || !relatedCollection.value.startsWith('directus_'))
) {
	if (relatedCollection.value) {
		const relatedInitialValues = computed(() => (initialValues.value ?? {})[props.junctionField!] ?? {});

		const relatedInternalEdits = computed({
			get: () => {
				return internalEdits.value[props.junctionField!] ?? {};
			},
			set: (edits) => {
				internalEdits.value[props.junctionField!] = edits;
			},
		});

		relatedCollab = useCollab(
			relatedCollection as any,
			relatedPrimaryKey,
			ref(null),
			relatedInitialValues,
			relatedInternalEdits,
			refresh,
			overlayActive,
		);
	}

	collab = useCollab(collection, primaryKey, ref(null), initialValues, internalEdits, refresh, overlayActive);
}

const isNew = computed(() => props.primaryKey === '+' && props.relatedPrimaryKey === '+');

const hasEdits = computed(() => !isEmpty(internalEdits.value));
const router = useRouter();
const { confirmCancel, discardAndCancel, confirmCancellation } = useCancelGuard();
const { confirmLeave, leaveTo } = useEditsGuard(confirmCancellation);

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

	const selectedGroupKeys = getSelectedGroupKeys();

	const selectedAvailableFields = availableFields.filter((field) => {
		const groupKey = field.meta?.group;

		if (groupKey && selectedGroupKeys.includes(groupKey)) return true;

		if (groupKey && !selectedGroupKeys.includes(groupKey)) field.meta!.group = null;
		return isSelected(field.field);
	});

	if (!selectedAvailableFields.length) return availableFields;

	return selectedAvailableFields;

	function isSelected(fieldKey: string) {
		return props.selectedFields!.includes(fieldKey);
	}

	function getSelectedGroupKeys() {
		const groupKeys: string[] = [];

		availableFields.forEach((field) => {
			const isGroup = field.meta?.special?.includes('group');
			if (!isGroup) return;

			if (isSelected(field.field)) groupKeys.push(field.field);
		});

		return addNestedGroupKeys(groupKeys);
	}

	function addNestedGroupKeys(groupKeys: string[]) {
		availableFields.forEach((field) => {
			const isGroup = field.meta?.special?.includes('group');
			if (!isGroup) return;

			const groupIsAlreadySelected = groupKeys.includes(field.field);
			if (groupIsAlreadySelected) return;

			const groupKey = field.meta?.group;
			if (!groupKey) return;

			const parentGroupIsSelected = groupKeys.includes(groupKey);
			if (!parentGroupIsSelected) return;

			groupKeys.push(field.field);
			groupKeys = addNestedGroupKeys(groupKeys);
		});

		return groupKeys;
	}
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
	if (props.disabled || !hasEdits.value) return false;
	if (!relatedCollection.value) return saveAllowed.value;
	return saveAllowed.value || saveRelatedCollectionAllowed.value;
});

const {
	template,
	templateData,
	loading: templateDataLoading,
} = useTemplateData(templateCollection, templatePrimaryKey);

const overlayItemContentProps = computed(() => {
	return {
		collection: props.collection,
		primaryKey: props.primaryKey,
		junctionField: props.junctionField,
		relatedCollection: relatedCollection.value,
		initialValues: initialValues.value,
		fields: fields.value,
		disabled: props.disabled,
		nonEditable: props.nonEditable,
		loading: loading.value,
		validationErrors: validationErrors.value,
		junctionFieldLocation: props.junctionFieldLocation,
		relatedCollectionFields: relatedCollectionFields.value,
		relatedPrimaryKey: props.relatedPrimaryKey,
		relatedPrimaryKeyField: relatedPrimaryKeyField.value?.field ?? null,
		refresh,
		collabContext: collab?.collabContext,
		relatedCollabContext: relatedCollab?.collabContext,
	};
});

const { flowDialogsContext, provideRunManualFlow } = useFlows({
	collection,
	primaryKey: primaryKey,
	location: 'item',
	hasEdits,
	onRefreshCallback: refresh,
});

provideRunManualFlow();

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

	const notificationsStore = useNotificationsStore();

	watch(
		() => props.active,
		(isActive) => {
			notificationsStore.setOverlayIsActive(!!isActive);

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

	function getFetchEndpoint(collection: string, primaryKey: PrimaryKey) {
		const baseEndpoint = getEndpoint(collection);
		if (isSystemCollection(collection)) return `${baseEndpoint}/${primaryKey}`;
		return `${baseEndpoint}/${encodeURIComponent(primaryKey)}`;
	}

	async function fetchItem() {
		if (!props.primaryKey) return;

		loading.value = true;

		const endpoint = getFetchEndpoint(props.collection, props.primaryKey);

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

		const endpoint = getFetchEndpoint(collection, props.relatedPrimaryKey);

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

	useShortcut(props.applyShortcut, (_event, cancelNext) => {
		// Note that drawer and modal have existing shortcuts.
		if (props.overlay !== 'popover' || !internalActive.value) return;

		save();
		cancelNext();
	});

	useShortcut('escape', (_event, cancelNext) => {
		// Note that drawer and modal have existing shortcuts.
		if (props.overlay !== 'popover' || !internalActive.value) return;

		cancel();
		cancelNext();
	});

	return { save, cancel, overlayActive, getTooltip };

	function getTooltip(shortcutType: 'save' | 'cancel', label: string | null = null) {
		let shortcut = null;

		if (shortcutType === 'save') shortcut = translateShortcut(props.applyShortcut.split('+'));
		else shortcut = translateShortcut(['esc']);

		if (label && shortcut) return `${label} (${shortcut})`;
		if (label) return label;
		if (shortcut) return shortcut;

		return null;
	}

	function validateForm({ defaultValues, existingValues, editsToValidate, fieldsToValidate }: Record<string, any>) {
		return validateItem(
			mergeItemData(defaultValues, existingValues, editsToValidate),
			fieldsToValidate,
			isNew.value,
			true,
		);
	}

	function save() {
		if (!isSavable.value) return;

		const errors = validateForm({
			defaultValues: unref(getDefaultValuesFromFields(fieldsWithoutCircular.value)),
			existingValues: initialValues?.value,
			editsToValidate: internalEdits.value,
			fieldsToValidate: fieldsWithoutCircular.value,
		});

		let junctionValues = null;

		if (props.junctionField) {
			junctionValues = {
				defaultValues: unref(getDefaultValuesFromFields(relatedCollectionFields.value)),
				existingValues: initialValues?.value?.[props.junctionField],
				editsToValidate: internalEdits.value[props.junctionField],
				fieldsToValidate: relatedCollectionFields.value,
			};

			const junctionErrors = validateForm(junctionValues);

			errors.push(...junctionErrors);
		}

		if (nestedValidationErrors.value?.length) {
			errors.push(...nestedValidationErrors.value);
		}

		if (errors.length > 0) {
			validationErrors.value = errors;
			return;
		} else {
			validationErrors.value = [];
		}

		if (props.junctionField && Object.values(junctionValues?.defaultValues ?? {}).some((value) => value !== null)) {
			internalEdits.value[props.junctionField] = junctionValues?.editsToValidate ?? {};
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
		if (confirmCancellation.value) {
			confirmCancel.value = true;
			return;
		}

		discardAndCancel();
	}
}

function useCancelGuard() {
	const confirmCancel = ref(false);

	const confirmCancellation = computed(() => {
		if (!hasEdits.value) return false;

		if (collab?.connected.value) {
			return collab.users.value.length > 1;
		}

		return props.preventCancelWithEdits;
	});

	return {
		confirmCancel,
		discardAndCancel,
		confirmCancellation,
	};

	function discardAndCancel() {
		validationErrors.value = [];
		internalEdits.value = {};
		internalActive.value = false;
		confirmCancel.value = false;
	}
}

function popoverClickOutsideMiddleware(e: Event) {
	const dialogs = document.getElementById('dialog-outlet');
	if (!dialogs) return true;
	return !dialogs.contains(e.target as Node);
}
</script>

<template>
	<VDrawer
		v-if="overlay === 'drawer'"
		v-model="overlayActive"
		:title="title"
		:icon="collectionInfo?.meta?.icon ?? undefined"
		persistent
		:apply-shortcut
		@apply="save"
		@cancel="cancel"
	>
		<template v-if="template !== null && templateData && primaryKey !== '+'" #title>
			<VSkeletonLoader v-if="loading || templateDataLoading" class="title-loader" type="text" />

			<h1 v-else class="type-title">
				<RenderTemplate :collection="templateCollection?.collection" :item="templateData" :template="template" />
			</h1>
		</template>

		<template #subtitle>
			<VBreadcrumb :items="[{ name: collectionInfo?.name, disabled: true }]" />
		</template>

		<template #actions>
			<CollabAvatars
				:model-value="uniqBy([...(collab?.users.value ?? []), ...(relatedCollab?.users.value ?? [])], 'connection')"
				:connected="collab?.connected.value && (!relatedCollab || relatedCollab?.connected.value)"
			/>
			<slot name="actions" />

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="getTooltip('save', $t('save'))"
				:disabled="!isSavable"
				icon="check"
				@click="save"
			/>
		</template>

		<OverlayItemContent
			v-model:internal-edits="internalEdits"
			v-bind="overlayItemContentProps"
			class="drawer-item-content"
		/>
	</VDrawer>

	<VDialog
		v-else-if="overlay === 'modal'"
		v-model="overlayActive"
		persistent
		keep-behind
		:apply-shortcut
		@apply="save"
		@esc="cancel"
	>
		<VCard class="modal-card">
			<VCardTitle>
				<VIcon :name="collectionInfo?.meta?.icon ?? undefined" class="modal-title-icon" />
				{{ title }}
			</VCardTitle>

			<OverlayItemContent
				v-model:internal-edits="internalEdits"
				v-bind="overlayItemContentProps"
				class="modal-item-content"
			/>

			<div class="shadow-cover" />

			<VCardActions>
				<slot name="actions" />
				<VButton v-tooltip="getTooltip('cancel')" secondary @click="cancel">{{ $t('cancel') }}</VButton>
				<VButton v-tooltip="getTooltip('save')" :disabled="!isSavable" @click="save">{{ $t('save') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>

	<VMenu
		v-else-if="overlay === 'popover'"
		v-bind="popoverProps"
		v-model="overlayActive"
		:close-on-click="false"
		:close-on-content-click="false"
		placement="top-start"
		:offset-x="-16"
		show-arrow
		:arrow-padding="16"
		seamless
		keep-behind
	>
		<template #activator="activatorProps">
			<slot name="popover-activator" v-bind="activatorProps" />
		</template>

		<div
			v-click-outside="{
				handler: cancel,
				middleware: popoverClickOutsideMiddleware,
				disabled: !preventCancelWithEdits,
				events: ['click'],
			}"
		>
			<div class="popover-actions">
				<div class="popover-actions-inner">
					<slot name="actions" />

					<VButton v-tooltip="getTooltip('cancel', $t('cancel'))" x-small rounded icon secondary @click="cancel">
						<VIcon small name="close" outline />
					</VButton>

					<VButton v-tooltip="getTooltip('save', $t('save'))" x-small rounded icon :disabled="!isSavable" @click="save">
						<VIcon small name="check" outline />
					</VButton>
				</div>
			</div>

			<OverlayItemContent
				v-model:internal-edits="internalEdits"
				v-bind="overlayItemContentProps"
				class="popover-item-content"
			/>
		</div>
	</VMenu>

	<FlowDialogs v-bind="flowDialogsContext" />

	<ComparisonModal
		v-if="collab"
		:model-value="Boolean(collab.collabCollision.value) && overlayActive"
		:collection="collection"
		:primary-key="primaryKey"
		:current-collab="collab.collabCollision.value"
		:collab-context="collab.collabContext"
		mode="collab"
		@confirm="collab.update"
		@cancel="collab.clearCollidingChanges"
	/>

	<ComparisonModal
		v-if="relatedCollab"
		:model-value="Boolean(relatedCollab.collabCollision.value) && overlayActive"
		:collection="collection"
		:primary-key="primaryKey"
		:current-collab="relatedCollab.collabCollision.value"
		:collab-context="relatedCollab.collabContext"
		mode="collab"
		@confirm="relatedCollab.update"
		@cancel="relatedCollab.clearCollidingChanges"
	/>

	<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
		<VCard v-if="!collab?.connected">
			<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
			<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
			<VCardActions>
				<VButton secondary @click="discardAndLeave">
					{{ $t('discard_changes') }}
				</VButton>
				<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
			</VCardActions>
		</VCard>
		<VCard v-else>
			<VCardTitle>{{ $t('unsaved_changes_collab') }}</VCardTitle>
			<VCardText>{{ $t('unsaved_changes_copy_collab') }}</VCardText>
			<VCardActions>
				<VButton secondary @click="discardAndLeave">
					{{ $t('close_drawer') }}
				</VButton>
				<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>

	<VDialog v-model="confirmCancel" @esc="confirmCancel = false" @apply="discardAndCancel">
		<VCard v-if="!collab?.connected">
			<VCardTitle>{{ $t('discard_all_changes') }}</VCardTitle>
			<VCardText>{{ $t('discard_changes_copy') }}</VCardText>
			<VCardActions>
				<VButton secondary @click="discardAndCancel">
					{{ $t('discard_changes') }}
				</VButton>
				<VButton @click="confirmCancel = false">{{ $t('keep_editing') }}</VButton>
			</VCardActions>
		</VCard>
		<VCard v-else>
			<VCardTitle>{{ $t('unsaved_changes_collab') }}</VCardTitle>
			<VCardText>{{ $t('unsaved_changes_copy_collab') }}</VCardText>
			<VCardActions>
				<VButton secondary @click="discardAndCancel">
					{{ $t('close_drawer') }}
				</VButton>
				<VButton @click="confirmCancel = false">{{ $t('keep_editing') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style lang="scss" scoped>
.modal-card,
.modal-item-content,
.popover-item-content {
	--theme--form--column-gap: 16px;
	--theme--form--row-gap: 24px;
}

.modal-card {
	inline-size: calc(
		2 * var(--form-column-width) + var(--theme--form--column-gap) + 2 * var(--v-card-padding)
	) !important;
	max-inline-size: 90vw !important;

	@media (min-height: 375px) {
		--button-height: var(--v-button-height, 44px);
		--button-gap: 12px;
		--shadow-height: 7px;
		--shadow-cover-height: 10px;

		.v-card-actions {
			z-index: 100;
			position: sticky;
			inset-block-end: calc(var(--button-gap) - var(--v-card-padding));
			padding-block-start: var(--button-gap);
			background: var(--v-card-background-color);
			box-shadow: 0 0 var(--shadow-height) 0 rgb(0 0 0 / 0.2);

			.dark & {
				box-shadow: 0 0 var(--shadow-height) 0 black;
			}
		}

		.shadow-cover {
			z-index: 101;
			position: sticky;
			inset-block-end: calc(var(--button-gap) + var(--button-height) + var(--button-gap) - var(--shadow-cover-height));
			block-size: calc(var(--v-card-padding) - var(--button-gap));
			inline-size: 100%;

			&::after {
				content: '';
				position: absolute;
				inset-block-end: 0;
				inset-inline-start: 0;
				inline-size: 100%;
				block-size: var(--shadow-cover-height);
				background: var(--v-card-background-color);
			}
		}
	}
}

.modal-title-icon {
	margin-inline-end: 8px;
}

.modal-item-content {
	padding: var(--v-card-padding);
	padding-block-end: var(--theme--form--column-gap);
}

.popover-item-content {
	--content-padding: var(--theme--form--column-gap);
	--content-padding-bottom: var(--theme--form--row-gap);

	padding-block-start: var(--content-padding-bottom);
	position: relative;
	z-index: 0;
	inline-size: calc(2 * var(--form-column-width) + var(--theme--form--column-gap) + 2 * var(--content-padding));
	max-inline-size: 90vw;

	:deep(.v-form:first-child .first-visible-field .field-label),
	:deep(.v-form:first-child .first-visible-field.half + .half-right .field-label) {
		--popover-action-width: 100px; // 3 * 28 (button) + 2 * 8 (gap)

		max-inline-size: calc(100% - var(--popover-action-width));
	}

	&.empty {
		min-block-size: 232px;
	}
}

.popover-actions {
	position: sticky;
	inset-block-start: 0;
	inset-inline-start: 0;
	z-index: 1;
}

.popover-actions-inner {
	position: relative;
	display: flex;
	justify-content: end;
	gap: 8px;
	inset-block-start: 12px;
	inset-inline-end: 16px;
}

// Puts the action buttons closer to the field
.popover-actions:has(+ .popover-item-content .v-form:first-child > .field:first-child) .popover-actions-inner {
	position: absolute;
}
</style>
