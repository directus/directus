<script setup lang="ts">
import ValidationErrors from '@/components/v-form/components/validation-errors.vue';
import VForm from '@/components/v-form/v-form.vue';
import VInfo from '@/components/v-info.vue';
import FilePreviewReplace from '@/views/private/components/file-preview-replace.vue';
import type { Field, PrimaryKey } from '@directus/types';
import { cloneDeep } from 'lodash';
import { computed, useTemplateRef } from 'vue';

const {
	collection,
	junctionField,
	relatedCollection,
	relatedCollectionFields,
	initialValues,
	fields,
	junctionFieldLocation = 'bottom',
	relatedPrimaryKeyField,
} = defineProps<{
	collection: string;
	primaryKey: PrimaryKey | null;
	junctionField: string | null;
	relatedCollection: string | null;
	initialValues: Record<string, any> | null;
	fields: Field[];
	disabled: boolean;
	nonEditable: boolean;
	loading: boolean;
	validationErrors: any[];
	junctionFieldLocation?: string;
	relatedCollectionFields: Field[];
	relatedPrimaryKey: PrimaryKey;
	relatedPrimaryKeyField: string | null;
	refresh: () => void;
}>();

const internalEdits = defineModel<Record<string, any>>('internal-edits');

const { mainInitialValues, junctionInitialValues } = useInitialValues();
const { file } = useFile();
const { scrollToField } = useValidationScrollToField();

const swapFormOrder = computed(() => junctionFieldLocation === 'top');
const hasVisibleFieldsRelated = computed(() => relatedCollectionFields.some((field: Field) => !field.meta?.hidden));
const hasVisibleFieldsJunction = computed(() => fields.some((field: Field) => !field.meta?.hidden));
const emptyForm = computed(() => !hasVisibleFieldsRelated.value && !hasVisibleFieldsJunction.value);

function setRelationEdits(edits: any) {
	if (!junctionField || !internalEdits.value) return;

	internalEdits.value[junctionField] = edits;
}

function useInitialValues() {
	const mainInitialValues = computed(() => {
		if (!initialValues) return null;
		if (!junctionField || !initialValues[junctionField] || !relatedPrimaryKeyField) return initialValues;

		const tempInitialValues = cloneDeep(initialValues);
		tempInitialValues[junctionField] = initialValues[junctionField][relatedPrimaryKeyField];

		return tempInitialValues;
	});

	const junctionInitialValues = computed(() => {
		if (!initialValues || !junctionField || !initialValues[junctionField]) return null;
		return initialValues[junctionField];
	});

	return {
		mainInitialValues,
		junctionInitialValues,
	};
}

function useFile() {
	const isDirectusFiles = computed(() => {
		return collection === 'directus_files' || relatedCollection === 'directus_files';
	});

	const file = computed(() => {
		if (isDirectusFiles.value === false) return null;

		const fileData = junctionField ? junctionInitialValues.value : mainInitialValues.value;

		return fileData || null;
	});

	return { file, isDirectusFiles };
}

function useValidationScrollToField() {
	const mainFormEl = useTemplateRef<any>('mainForm');
	const junctionFormEl = useTemplateRef<any>('junctionForm');

	return { scrollToField };

	function scrollToField(fieldKey: string) {
		const fieldOfMainForm = fields.find((field: Field) => field.field === fieldKey);

		if (fieldOfMainForm) {
			mainFormEl.value?.$refs?.el?.scrollIntoView({ behavior: 'smooth' });
			return;
		}

		junctionFormEl.value?.$refs?.el?.scrollIntoView({ behavior: 'smooth' });
	}
}
</script>

<template>
	<div class="overlay-item-content" :class="{ empty: emptyForm }">
		<FilePreviewReplace v-if="file" class="preview" :file="file" in-modal @replace="refresh" />

		<VInfo v-if="emptyForm" :title="$t('no_visible_fields')" icon="search" center>
			{{ $t('no_visible_fields_copy') }}
		</VInfo>

		<div v-else class="overlay-item-order" :class="{ swap: swapFormOrder }">
			<ValidationErrors
				v-if="validationErrors?.length"
				class="validation-errors"
				:validation-errors
				:fields="[...fields, ...relatedCollectionFields]"
				@scroll-to-field="scrollToField"
			/>

			<VForm
				v-if="junctionField"
				ref="junctionForm"
				:model-value="internalEdits?.[junctionField]"
				:disabled="disabled"
				:non-editable="nonEditable"
				:loading="loading"
				:show-no-visible-fields="false"
				:initial-values="junctionInitialValues"
				:autofocus="!swapFormOrder"
				:show-divider="!swapFormOrder && hasVisibleFieldsJunction"
				:primary-key="relatedPrimaryKey"
				:fields="relatedCollectionFields"
				@update:model-value="setRelationEdits"
			/>

			<VForm
				ref="mainForm"
				v-model="internalEdits"
				:disabled="disabled"
				:non-editable="nonEditable"
				:loading="loading"
				:show-no-visible-fields="false"
				:initial-values="mainInitialValues"
				:autofocus="swapFormOrder"
				:show-divider="swapFormOrder && hasVisibleFieldsRelated"
				:primary-key="primaryKey"
				:fields="fields"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.v-divider {
	margin: 52px 0;
}

.overlay-item-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);

	.preview {
		margin-block-end: var(--theme--form--row-gap);
	}

	.validation-errors {
		margin-block-end: var(--theme--form--row-gap);
	}

	.overlay-item-order {
		&.swap {
			display: flex;
			flex-direction: column-reverse;
		}
	}
}
</style>
