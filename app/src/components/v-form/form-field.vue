<template>
	<div class="field" :class="[field.meta?.width || 'full', { invalid: validationError }]">
		<v-menu v-if="field.hideLabel !== true" placement="bottom-start" show-arrow>
			<template #activator="{ toggle, active }">
				<form-field-label
					:field="field"
					:toggle="toggle"
					:active="active"
					:batch-mode="batchMode"
					:batch-active="batchActive"
					:edited="isEdited"
					:has-error="!!validationError"
					:badge="badge"
					:raw-editor-enabled="rawEditorEnabled"
					:raw-editor-active="rawEditorActive"
					:loading="loading"
					@toggle-batch="$emit('toggle-batch', $event)"
					@toggle-raw="$emit('toggle-raw', $event)"
				/>
			</template>

			<form-field-menu
				:field="field"
				:model-value="internalValue"
				:initial-value="initialValue"
				:restricted="isDisabled"
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
			:disabled="isDisabled"
			:primary-key="primaryKey"
			:raw-editor-enabled="rawEditorEnabled"
			:raw-editor-active="rawEditorActive"
			:direction="direction"
			@update:model-value="emitValue($event)"
			@set-field-value="$emit('setFieldValue', $event)"
		/>

		<form-field-raw-editor
			:show-modal="showRaw"
			:field="field"
			:current-value="internalValue"
			:disabled="isDisabled"
			@cancel="showRaw = false"
			@set-raw-value="onRawValueSubmit"
		/>

		<small v-if="field.meta && field.meta.note" v-md="field.meta.note" class="type-note" />

		<small v-if="validationError" class="validation-error selectable">
			<template v-if="field.meta?.validation_message">
				{{ field.meta?.validation_message }}
				<v-icon v-tooltip="validationMessage" small right name="help" />
			</template>
			<template v-else>{{ validationPrefix }}{{ validationMessage }}</template>
		</small>
	</div>
</template>

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
import FormFieldMenu from './form-field-menu.vue';
import FormFieldRawEditor from './form-field-raw-editor.vue';
import type { FormField } from './types';

interface Props {
	field: FormField;
	batchMode?: boolean;
	batchActive?: boolean;
	disabled?: boolean;
	modelValue?: any;
	initialValue?: any;
	primaryKey?: string | number;
	loading?: boolean;
	validationError?: ValidationError;
	autofocus?: boolean;
	badge?: string;
	rawEditorEnabled?: boolean;
	rawEditorActive?: boolean;
	direction?: string;
}

const props = withDefaults(defineProps<Props>(), {
	batchMode: false,
	batchActive: false,
	disabled: false,
	modelValue: undefined,
	initialValue: undefined,
	primaryKey: undefined,
	loading: false,
	validationError: undefined,
	autofocus: false,
	badge: undefined,
	rawEditorEnabled: false,
	rawEditorActive: false,
	direction: undefined,
});

const emit = defineEmits(['toggle-batch', 'toggle-raw', 'unset', 'update:modelValue', 'setFieldValue']);

const { t } = useI18n();

const isDisabled = computed(() => {
	if (props.disabled) return true;
	if (props.field?.meta?.readonly === true) return true;
	if (props.batchMode && props.batchActive === false) return true;
	return false;
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
		} catch (e) {
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
		() => props.modelValue !== undefined && isEqual(props.modelValue, props.initialValue) === false
	);

	watch(
		() => props.modelValue,
		() => {
			const newVal = getInternalValue();

			if (!isEqual(internalValue.value, newVal)) {
				internalValue.value = newVal;
			}
		}
	);

	return { internalValue, isEdited, defaultValue };

	function getInternalValue(): any {
		if (props.modelValue !== undefined) return props.modelValue;
		if (props.initialValue !== undefined) return props.initialValue;
		return defaultValue.value;
	}
}
</script>

<style lang="scss" scoped>
.field {
	position: relative;
}

.type-note {
	position: relative;
	display: block;
	max-width: 520px;
	margin-top: 4px;

	:deep(a) {
		color: var(--primary);

		&:hover {
			color: var(--primary-125);
		}
	}
}

.invalid {
	margin: -12px;
	padding: 12px;
	background-color: var(--danger-alt);
	border-radius: var(--border-radius);
	transition: var(--medium) var(--transition);
	transition-property: background-color, padding, margin;
}

.validation-error {
	display: block;
	margin-top: 4px;
	color: var(--danger);
	font-style: italic;
}

.label-spacer {
	height: 28px;
}
</style>
