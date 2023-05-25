<template>
	<v-drawer v-model="internalActive" :title="title" persistent @cancel="cancel">
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
			<v-button v-tooltip.bottom="t('save')" icon rounded @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="drawer-item-content">
			<file-preview
				v-if="junctionField && file"
				:src="file.src"
				:mime="file.type"
				:width="file.width"
				:height="file.height"
				:title="file.title"
				:in-modal="true"
			/>
			<v-info v-if="emptyForm" :title="t('no_visible_fields')" icon="search" center>
				{{ t('no_visible_fields_copy') }}
			</v-info>
			<div v-else class="drawer-item-order" :class="{ swap: swapFormOrder }">
				<v-form
					v-if="junctionField"
					:disabled="disabled"
					:loading="loading"
					:show-no-visible-fields="false"
					:initial-values="initialValues?.[junctionField]"
					:primary-key="relatedPrimaryKey"
					:model-value="internalEdits?.[junctionField]"
					:fields="relatedCollectionFields"
					:validation-errors="junctionField ? validationErrors : undefined"
					:autofocus="!swapFormOrder"
					:show-divider="!swapFormOrder"
					@update:model-value="setRelationEdits"
				/>

				<v-form
					v-model="internalEdits"
					:disabled="disabled"
					:loading="loading"
					:show-no-visible-fields="false"
					:initial-values="initialValues"
					:autofocus="swapFormOrder"
					:show-divider="swapFormOrder"
					:primary-key="primaryKey"
					:fields="fields"
					:validation-errors="!junctionField ? validationErrors : undefined"
				/>
			</div>
		</div>
	</v-drawer>
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

<script setup lang="ts">
import api from '@/api';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { usePermissions } from '@/composables/use-permissions';
import { useTemplateData } from '@/composables/use-template-data';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { validateItem } from '@/utils/validate-item';
import FilePreview from '@/views/private/components/file-preview.vue';
import { useCollection } from '@directus/composables';
import { Field, Relation } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { isEmpty, merge, set } from 'lodash';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

interface Props {
	collection: string;
	active?: boolean;
	primaryKey?: string | number | null;
	edits?: Record<string, any>;
	junctionField?: string | null;
	disabled?: boolean;
	// There's an interesting case where the main form can be a newly created item ('+'), while
	// it has a pre-selected related item it needs to alter. In that case, we have to fetch the
	// related data anyway.
	relatedPrimaryKey?: string | number;
	// If this drawer-item is opened from a relational interface, we need to force-block the field
	// that relates back to the parent item.
	circularField?: string | null;
	junctionFieldLocation?: string;
}

const props = withDefaults(defineProps<Props>(), {
	active: undefined,
	primaryKey: null,
	edits: undefined,
	junctionField: null,
	disabled: false,
	relatedPrimaryKey: '+',
	circularField: null,
	junctionFieldLocation: 'bottom',
});

const emit = defineEmits(['update:active', 'input']);

const { t, te } = useI18n();

const validationErrors = ref<any[]>([]);

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const { internalActive } = useActiveState();

const { junctionFieldInfo, relatedCollection, relatedCollectionInfo, setRelationEdits, relatedPrimaryKeyField } =
	useRelation();

const { internalEdits, loading, initialValues } = useItem();
const { save, cancel } = useActions();

const { collection } = toRefs(props);

const { info: collectionInfo, primaryKeyField } = useCollection(collection);

const isNew = computed(() => props.primaryKey === '+' && props.relatedPrimaryKey === '+');

const swapFormOrder = computed(() => {
	return props.junctionFieldLocation === 'top';
});

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

const { fields: relatedCollectionFields } = usePermissions(
	relatedCollection as any,
	computed(() => initialValues.value && initialValues.value[props.junctionField as any]),
	computed(() => props.primaryKey === '+')
);

const { fields: fieldsWithPermissions } = usePermissions(
	collection,
	initialValues,
	computed(() => props.primaryKey === '+')
);

const fields = computed(() => {
	if (props.circularField) {
		return fieldsWithPermissions.value.map((field: Field) => {
			if (field.field === props.circularField) {
				set(field, 'meta.readonly', true);
			}

			return field;
		});
	} else {
		return fieldsWithPermissions.value;
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

const emptyForm = computed(() => {
	const visibleFieldsRelated = relatedCollectionFields.value.filter((field: Field) => !field.meta?.hidden);
	const visibleFieldsJunction = fields.value.filter((field: Field) => !field.meta?.hidden);
	return visibleFieldsRelated.length + visibleFieldsJunction.length === 0;
});

const templatePrimaryKey = computed(() =>
	junctionFieldInfo.value ? String(props.relatedPrimaryKey) : String(props.primaryKey)
);

const templateCollection = computed(() => relatedCollectionInfo.value || collectionInfo.value);
const { templateData, loading: templateDataLoading } = useTemplateData(templateCollection, templatePrimaryKey);

const template = computed(
	() => relatedCollectionInfo.value?.meta?.display_template || collectionInfo.value?.meta?.display_template || null
);

const { file } = useFile();

function useFile() {
	const isDirectusFiles = computed(() => {
		return relatedCollection.value === 'directus_files';
	});

	const file = computed(() => {
		if (isDirectusFiles.value === false || !initialValues.value || !props.junctionField) return null;
		const fileData = initialValues.value?.[props.junctionField];
		if (!fileData) return null;

		const src = `assets/${fileData.id}?key=system-large-contain`;
		return { ...fileData, src };
	});

	return { file, isDirectusFiles };
}

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
		{ immediate: true }
	);

	return { internalEdits, loading, initialValues, fetchItem };

	async function fetchItem() {
		if (!props.primaryKey) return;

		loading.value = true;

		const baseEndpoint = getEndpoint(props.collection);

		const endpoint = props.collection.startsWith('directus_')
			? `${baseEndpoint}/${props.primaryKey}`
			: `${baseEndpoint}/${encodeURIComponent(props.primaryKey)}`;

		let fields = '*';

		if (props.junctionField) {
			fields = `*,${props.junctionField}.*`;
		}

		try {
			const response = await api.get(endpoint, { params: { fields } });

			initialValues.value = response.data.data;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			loading.value = false;
		}
	}

	async function fetchRelatedItem() {
		const collection = relatedCollection.value;

		if (!collection || !junctionFieldInfo.value) return;

		loading.value = true;

		const baseEndpoint = getEndpoint(collection);

		const endpoint = collection.startsWith('directus_')
			? `${baseEndpoint}/${props.relatedPrimaryKey}`
			: `${baseEndpoint}/${encodeURIComponent(props.relatedPrimaryKey)}`;

		try {
			const response = await api.get(endpoint);

			initialValues.value = {
				...(initialValues.value || {}),
				[junctionFieldInfo.value.field]: response.data.data,
			};
		} catch (err: any) {
			unexpectedError(err);
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

	return { junctionFieldInfo, relatedCollection, relatedCollectionInfo, setRelationEdits, relatedPrimaryKeyField };

	function setRelationEdits(edits: any) {
		if (!props.junctionField) return;

		internalEdits.value[props.junctionField] = edits;
	}
}

function useActions() {
	return { save, cancel };

	function save() {
		const editsToValidate = props.junctionField ? internalEdits.value[props.junctionField] : internalEdits.value;
		const fieldsToValidate = props.junctionField ? relatedCollectionFields.value : fieldsWithoutCircular.value;
		const defaultValues = getDefaultValuesFromFields(fieldsToValidate);
		const existingValues = props.junctionField ? initialValues?.value?.[props.junctionField] : initialValues?.value;

		let errors = validateItem(
			merge({}, defaultValues.value, existingValues, editsToValidate),
			fieldsToValidate,
			isNew.value
		);

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

<style lang="scss" scoped>
.v-divider {
	margin: 52px 0;
}

.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);

	.file-preview {
		margin-bottom: var(--form-vertical-gap);
	}
	.drawer-item-order {
		&.swap {
			display: flex;
			flex-direction: column-reverse;
		}
	}
}
</style>
