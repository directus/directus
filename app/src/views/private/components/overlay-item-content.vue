<script setup lang="ts">
import { Field, PrimaryKey } from '@directus/types';
import { computed, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import ValidationErrors from '@/components/v-form/validation-errors.vue';
import FilePreviewReplace from '@/views/private/components/file-preview-replace.vue';

const {
	collection,
	junctionField,
	relatedCollection,
	relatedCollectionFields,
	initialValues,
	fields,
	junctionFieldLocation = 'bottom',
} = defineProps<{
	collection: string;
	primaryKey: PrimaryKey | null;
	junctionField: string | null;
	relatedCollection: string | null;
	initialValues: Record<string, any> | null;
	fields: Field[];
	disabled: boolean;
	loading: boolean;
	validationErrors: any[];
	junctionFieldLocation?: string;
	relatedCollectionFields: Field[];
	relatedPrimaryKey: PrimaryKey;
	refresh: () => void;
}>();

const internalEdits = defineModel<Record<string, any>>('internal-edits');

const { t } = useI18n();

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

function useFile() {
	const isDirectusFiles = computed(() => {
		return collection === 'directus_files' || relatedCollection === 'directus_files';
	});

	const file = computed(() => {
		if (isDirectusFiles.value === false || !initialValues) return null;

		const fileData = junctionField ? initialValues?.[junctionField] : initialValues;

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
		<file-preview-replace v-if="file" class="preview" :file="file" in-modal @replace="refresh" />

		<v-info v-if="emptyForm" :title="t('no_visible_fields')" icon="search" center>
			{{ t('no_visible_fields_copy') }}
		</v-info>

		<div v-else class="overlay-item-order" :class="{ swap: swapFormOrder }">
			<validation-errors
				v-if="validationErrors?.length"
				class="validation-errors"
				:validation-errors
				:fields="[...fields, ...relatedCollectionFields]"
				@scroll-to-field="scrollToField"
			/>

			<v-form
				v-if="junctionField"
				ref="junctionForm"
				:model-value="internalEdits?.[junctionField]"
				:disabled="disabled"
				:loading="loading"
				:show-no-visible-fields="false"
				:initial-values="initialValues?.[junctionField]"
				:autofocus="!swapFormOrder"
				:show-divider="!swapFormOrder && hasVisibleFieldsJunction"
				:primary-key="relatedPrimaryKey"
				:fields="relatedCollectionFields"
				@update:model-value="setRelationEdits"
			/>

			<v-form
				ref="mainForm"
				v-model="internalEdits"
				:disabled="disabled"
				:loading="loading"
				:show-no-visible-fields="false"
				:initial-values="initialValues"
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
	padding-bottom: var(--content-padding-bottom);

	.preview {
		margin-bottom: var(--theme--form--row-gap);
	}

	.validation-errors {
		margin-bottom: var(--theme--form--row-gap);
	}

	.overlay-item-order {
		&.swap {
			display: flex;
			flex-direction: column-reverse;
		}
	}
}
</style>
