<script setup lang="ts">
import { useClipboard } from '@/composables/use-clipboard';
import { formatFieldFunction } from '@/utils/format-field-function';
import { ValidationError } from '@directus/types';
import { parseJSON } from '@directus/utils';
import { isEqual } from 'lodash';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FormFieldInterface from './form-field-interface.vue';
import FormFieldLabel from './form-field-label.vue';
import FormFieldMenu, { type MenuOptions } from './form-field-menu.vue';
import FormFieldRawEditor from './form-field-raw-editor.vue';
import type { ComparisonContext, FormField } from './types';

const props = withDefaults(
	defineProps<{
		field: FormField;
		batchMode?: boolean;
		batchActive?: boolean;
		comparison?: ComparisonContext;
		comparisonActive?: boolean;
		disabled?: boolean;
		nonEditable?: boolean;
		modelValue?: any;
		initialValue?: any;
		primaryKey?: string | number;
		loading?: boolean;
		validationError?: ValidationError;
		autofocus?: boolean;
		badge?: string;
		rawEditorEnabled?: boolean;
		rawEditorActive?: boolean;
		disabledMenuOptions?: MenuOptions[];
		disabledMenu?: boolean;
		direction?: string;
	}>(),
	{
		modelValue: undefined,
		initialValue: undefined,
		primaryKey: undefined,
		validationError: undefined,
		badge: undefined,
		direction: undefined,
	},
);

const emit = defineEmits(['toggle-batch', 'toggle-raw', 'unset', 'update:modelValue', 'setFieldValue']);

const { t } = useI18n();

const isDisabled = computed(() => {
	if (props.disabled) return true;
	if (props.field?.meta?.readonly === true) return true;
	if (props.batchMode && props.batchActive === false) return true;
	return false;
});

const isNonEditable = computed(() => !!props.nonEditable);

const isLabelHidden = computed(() => {
	if ((props.batchMode || !!props.comparison) && !props.field.meta?.special?.includes('no-data')) return false;
	return props.field.hideLabel;
});

const { internalValue, isEdited, defaultValue } = useComputedValues();

const { showRaw, copyRaw, pasteRaw, onRawValueSubmit } = useRaw();

const validationMessage = computed(() => {
	if (!props.validationError) return null;

	if (props.validationError.code === 'RECORD_NOT_UNIQUE') {
		return t('validationError.unique');
	} else {
		return t(`validationError.${props.validationError.type}`, props.validationError);
	}
});

const validationPrefix = computed(() => {
	if (!props.validationError) return null;

	if (props.validationError.field.includes('(') && props.validationError.field.includes(')')) {
		return formatFieldFunction(props.field.collection!, props.validationError.field) + ': ';
	}

	return null;
});

const showCustomValidationMessage = computed(() => {
	if (!props.validationError) return false;

	const customValidationMessage = !!props.field.meta?.validation_message;
	const hasCustomValidation = !!props.field.meta?.validation;

	return customValidationMessage && (!hasCustomValidation || props.validationError.code === 'FAILED_VALIDATION');
});

function emitValue(value: any) {
	if (
		(isEqual(value, props.initialValue) || (props.initialValue === undefined && isEqual(value, defaultValue.value))) &&
		props.batchMode === false
	) {
		emit('unset', props.field);
	} else {
		emit('update:modelValue', value);
	}
}

function useRaw() {
	const showRaw = ref(false);

	const { copyToClipboard, pasteFromClipboard } = useClipboard();

	function onRawValueSubmit(value: any) {
		showRaw.value = false;
		emitValue(value);
	}

	async function copyRaw() {
		await copyToClipboard(internalValue.value);
	}

	async function pasteRaw() {
		const pastedValue = await pasteFromClipboard();
		if (!pastedValue) return;

		try {
			internalValue.value = parseJSON(pastedValue);
		} catch {
			internalValue.value = pastedValue;
		}

		emitValue(internalValue.value);
	}

	return { showRaw, copyRaw, pasteRaw, onRawValueSubmit };
}

function useComputedValues() {
	const defaultValue = computed<any>(() => props.field?.schema?.default_value);
	const internalValue = ref<any>(getInternalValue());

	const isEdited = computed(
		() => props.modelValue !== undefined && isEqual(props.modelValue, props.initialValue) === false,
	);

	watch(
		() => props.modelValue,
		() => {
			const newVal = getInternalValue();

			if (!isEqual(internalValue.value, newVal)) {
				internalValue.value = newVal;
			}
		},
	);

	return { internalValue, isEdited, defaultValue };

	function getInternalValue(): any {
		if (props.modelValue !== undefined) return props.modelValue;
		if (props.initialValue !== undefined) return props.initialValue;
		return defaultValue.value;
	}
}
</script>

<template>
	<div
		:data-primary-key="primaryKey"
		:data-collection="field.collection"
		:data-field="field.field"
		class="field"
		:class="[
			field.meta?.width || 'full',
			{
				invalid: validationError,
			},
		]"
	>
		<v-menu v-if="!isLabelHidden" :disabled="disabledMenu" placement="bottom-start" show-arrow arrow-placement="start">
			<template #activator="{ toggle, active }">
				<form-field-label
					:field="field"
					:toggle="toggle"
					:active="active"
					:batch-mode="batchMode"
					:batch-active="batchActive"
					:comparison="comparison"
					:comparison-active="comparisonActive"
					:edited="isEdited"
					:has-error="!!validationError"
					:badge="badge"
					:raw-editor-enabled="rawEditorEnabled && !isNonEditable"
					:raw-editor-active="rawEditorActive"
					:loading="loading"
					:disabled-menu="disabledMenu"
					@toggle-batch="$emit('toggle-batch', $event)"
					@toggle-raw="$emit('toggle-raw', $event)"
				/>
			</template>

			<form-field-menu
				:field="field"
				:model-value="internalValue"
				:initial-value="initialValue"
				:restricted="isDisabled || isNonEditable"
				:disabled-options="disabledMenuOptions"
				@update:model-value="emitValue($event)"
				@unset="$emit('unset', $event)"
				@edit-raw="showRaw = true"
				@copy-raw="copyRaw"
				@paste-raw="pasteRaw"
			/>
		</v-menu>

		<div v-else-if="['full', 'fill'].includes(field.meta?.width ?? '') === false" class="label-spacer" />

		<form-field-interface
			:autofocus="autofocus"
			:model-value="internalValue"
			:field="field"
			:loading="loading"
			:batch-mode="batchMode"
			:batch-active="batchActive"
			:disabled="isDisabled || isNonEditable"
			:non-editable="isNonEditable"
			:primary-key="primaryKey"
			:raw-editor-enabled="rawEditorEnabled"
			:raw-editor-active="rawEditorActive"
			:direction="direction"
			:comparison="comparison"
			:comparison-active="comparisonActive"
			@update:model-value="emitValue($event)"
			@set-field-value="$emit('setFieldValue', $event)"
		/>

		<form-field-raw-editor
			:show-modal="showRaw"
			:field="field"
			:current-value="internalValue"
			:disabled="isDisabled || isNonEditable"
			@cancel="showRaw = false"
			@set-raw-value="onRawValueSubmit"
		/>

		<small v-if="field.meta && field.meta.note" v-md="{ value: field.meta.note, target: '_blank' }" class="type-note" />

		<small v-if="validationError" class="validation-error">
			<template v-if="showCustomValidationMessage">
				{{ field.meta?.validation_message }}
				<v-icon v-tooltip="validationMessage" small right name="help" />
			</template>
			<template v-else>{{ validationPrefix }}{{ validationMessage }}</template>
		</small>
	</div>
</template>

<style lang="scss" scoped>
.type-note {
	position: relative;
	display: block;
	max-inline-size: 520px;
	margin-block-start: 4px;

	:deep(a) {
		color: var(--theme--primary);

		&:hover {
			color: var(--theme--primary-accent);
		}
	}
}

.invalid {
	margin: -12px;
	padding: 12px;
	background-color: var(--danger-alt);
	border-radius: var(--theme--border-radius);
	transition: var(--medium) var(--transition);
	transition-property: background-color, padding, margin;
}

.validation-error {
	display: flex;
	align-items: center;
	margin-block-start: 4px;
	color: var(--theme--danger);
	font-style: italic;
}

.label-spacer {
	block-size: 28px;
}
</style>
