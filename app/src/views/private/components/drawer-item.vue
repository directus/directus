<script setup lang="ts">
import api from '@/api';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItemPermissions } from '@/composables/use-permissions';
import { useTemplateData } from '@/composables/use-template-data';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { validateItem } from '@/utils/validate-item';
import FilePreviewReplace from '@/views/private/components/file-preview-replace.vue';
import { useCollection } from '@directus/composables';
import { isSystemCollection } from '@directus/system-data';
import { Field, PrimaryKey, Relation } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { isEmpty, merge, set } from 'lodash';
import { Ref, computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

interface Props {
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
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: null,
	junctionField: null,
	relatedPrimaryKey: '+',
	circularField: null,
	junctionFieldLocation: 'bottom',
});

const emit = defineEmits<{
	'update:active': [value: boolean];
	input: [value: Record<string, any>];
}>();

const { t, te } = useI18n();

const validationErrors = ref<any[]>([]);

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const { internalActive } = useActiveState();

const { junctionFieldInfo, relatedCollection, relatedCollectionInfo, setRelationEdits, relatedPrimaryKeyField } =
	useRelation();

const { internalEdits, loading, initialValues, refresh } = useItem();
const { save, cancel } = useActions();

const { collection, primaryKey, relatedPrimaryKey } = toRefs(props);

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

const { fields: fieldsWithPermissions } = useItemPermissions(
	collection,
	primaryKey,
	computed(() => props.primaryKey === '+'),
);

const { fields: relatedCollectionFields } = useItemPermissions(
	relatedCollection as Ref<string>,
	relatedPrimaryKey,
	computed(() => props.primaryKey === '+'),
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

const hasVisibleFieldsRelated = computed(() =>
	relatedCollectionFields.value.some((field: Field) => !field.meta?.hidden),
);

const hasVisibleFieldsJunction = computed(() => fields.value.some((field: Field) => !field.meta?.hidden));

const emptyForm = computed(() => !hasVisibleFieldsRelated.value && !hasVisibleFieldsJunction.value);

const templatePrimaryKey = computed(() =>
	junctionFieldInfo.value ? String(props.relatedPrimaryKey) : String(props.primaryKey),
);

const templateCollection = computed(() => relatedCollectionInfo.value || collectionInfo.value);

const {
	template,
	templateData,
	loading: templateDataLoading,
} = useTemplateData(templateCollection, templatePrimaryKey);

const { file } = useFile();

function useFile() {
	const isDirectusFiles = computed(() => {
		return props.collection === 'directus_files' || relatedCollection.value === 'directus_files';
	});

	const file = computed(() => {
		if (isDirectusFiles.value === false || !initialValues.value) return null;

		const fileData = props.junctionField ? initialValues.value?.[props.junctionField] : initialValues.value;

		return fileData || null;
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

		const errors = validateItem(
			merge({}, defaultValues.value, existingValues, editsToValidate),
			fieldsToValidate,
			isNew.value,
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

<template>
	<v-drawer
		v-model="internalActive"
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
			<v-button v-tooltip.bottom="t('save')" icon rounded @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="drawer-item-content">
			<file-preview-replace v-if="file" class="preview" :file="file" in-modal @replace="refresh" />

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
					:show-divider="!swapFormOrder && hasVisibleFieldsJunction"
					@update:model-value="setRelationEdits"
				/>

				<v-form
					v-model="internalEdits"
					:disabled="disabled"
					:loading="loading"
					:show-no-visible-fields="false"
					:initial-values="initialValues"
					:autofocus="swapFormOrder"
					:show-divider="swapFormOrder && hasVisibleFieldsRelated"
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

<style lang="scss" scoped>
.v-divider {
	margin: 52px 0;
}

.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);

	.preview {
		margin-bottom: var(--theme--form--row-gap);
	}

	.drawer-item-order {
		&.swap {
			display: flex;
			flex-direction: column-reverse;
		}
	}
}
</style>
