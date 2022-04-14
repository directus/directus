<template>
	<div :key="field.field" class="field" :class="[field.meta?.width || 'full', { invalid: validationError }]">
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
					:loading="loading"
					@toggle-batch="$emit('toggle-batch', $event)"
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
		<div v-else-if="['full', 'fill'].includes(field.meta?.width) === false" class="label-spacer" />

		<form-field-interface
			:autofocus="autofocus"
			:model-value="internalValue"
			:field="field"
			:loading="loading"
			:batch-mode="batchMode"
			:batch-active="batchActive"
			:disabled="isDisabled"
			:primary-key="primaryKey"
			@update:model-value="emitValue($event)"
			@set-field-value="$emit('setFieldValue', $event)"
		/>

		<v-dialog v-model="showRaw" @esc="showRaw = false">
			<v-card>
				<v-card-title>{{ isDisabled ? t('view_raw_value') : t('edit_raw_value') }}</v-card-title>
				<v-card-text>
					<v-textarea v-model="rawValue" :disabled="isDisabled" class="raw-value" :placeholder="t('enter_raw_value')" />
				</v-card-text>
				<v-card-actions>
					<v-button @click="showRaw = false">{{ t('done') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<small v-if="field.meta && field.meta.note" v-md="field.meta.note" class="type-note" />

		<small v-if="validationError" class="validation-error selectable">
			<template v-if="field.meta?.validation_message">
				{{ field.meta?.validation_message }}
				<v-icon v-tooltip="validationMessage" small right name="help_outline" />
			</template>
			<template v-else>{{ validationPrefix }}{{ validationMessage }}</template>
		</small>
	</div>
</template>

<script lang="ts" setup>
import { getJSType } from '@/utils/get-js-type';
import { Field, ValidationError } from '@directus/shared/types';
import { isEqual } from 'lodash';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FormFieldInterface from './form-field-interface.vue';
import FormFieldLabel from './form-field-label.vue';
import FormFieldMenu from './form-field-menu.vue';
import { formatFieldFunction } from '@/utils/format-field-function';
import useClipboard from '@/composables/use-clipboard';

interface Props {
	field: Field;
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
});

const emit = defineEmits(['toggle-batch', 'unset', 'update:modelValue', 'setFieldValue']);

const { t } = useI18n();

const isDisabled = computed(() => {
	if (props.disabled) return true;
	if (props.field?.meta?.readonly === true) return true;
	if (props.batchMode && props.batchActive === false) return true;
	return false;
});

const defaultValue = computed(() => {
	const value = props.field?.schema?.default_value;

	if (value !== undefined) return value;
	return undefined;
});

const internalValue = computed(() => {
	if (props.modelValue !== undefined) return props.modelValue;
	if (props.initialValue !== undefined) return props.initialValue;
	return defaultValue.value;
});

const isEdited = computed<boolean>(() => {
	return props.modelValue !== undefined && isEqual(props.modelValue, props.initialValue) === false;
});

const { showRaw, rawValue, copyRaw, pasteRaw } = useRaw();

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
		return formatFieldFunction(props.field.collection, props.validationError.field) + ': ';
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

	const type = computed(() => {
		return getJSType(props.field);
	});

	const rawValue = computed({
		get() {
			switch (type.value) {
				case 'object':
					return JSON.stringify(internalValue.value, null, '\t');
				case 'string':
				case 'number':
				case 'boolean':
				default:
					return internalValue.value;
			}
		},
		set(newRawValue: string) {
			switch (type.value) {
				case 'string':
					emit('update:modelValue', newRawValue);
					break;
				case 'number':
					emit('update:modelValue', Number(newRawValue));
					break;
				case 'boolean':
					emit('update:modelValue', newRawValue === 'true');
					break;
				case 'object':
					emit('update:modelValue', JSON.parse(newRawValue));
					break;
				default:
					emit('update:modelValue', newRawValue);
					break;
			}
		},
	});

	async function copyRaw() {
		await copyToClipboard(rawValue.value);
	}

	async function pasteRaw() {
		const pastedValue = await pasteFromClipboard();
		if (!pastedValue) return;
		rawValue.value = pastedValue;
	}

	return { showRaw, rawValue, copyRaw, pasteRaw };
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

.raw-value {
	--v-textarea-font-family: var(--family-monospace);
}

.label-spacer {
	height: 28px;
}
</style>
