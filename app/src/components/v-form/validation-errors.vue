<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { ValidationError, Field } from '@directus/types';
import { formatFieldFunction } from '@/utils/format-field-function';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';

type ValidationErrorWithDetails = ValidationError & {
	fieldName: string;
	groupName: string;
	hasCustomValidation: boolean;
	customValidationMessage: string | null;
};

const props = defineProps<{
	validationErrors: ValidationError[];
	fields: Field[];
}>();

defineEmits(['scroll-to-field']);

const { t } = useI18n();

const validationErrorsWithDetails = computed<ValidationErrorWithDetails[]>(() => {
	return props.validationErrors.map(
		(validationError: ValidationError & { nestedNames?: Record<string, string>; validation_message?: string }) => {
			const { field: _fieldKey, fn: functionName } = extractFieldFromFunction(validationError.field);
			const [fieldKey, ...nestedFieldKeys] = _fieldKey.split('.');
			const field = props.fields.find((field) => field.field === fieldKey);
			const group = props.fields.find((field) => field.field === validationError.group);
			const fieldName = getFieldName() + getNestedFieldNames(nestedFieldKeys, validationError.nestedNames);

			return {
				...validationError,
				field: fieldKey,
				fieldName,
				groupName: group?.name ?? validationError.group,
				hasCustomValidation: !!field?.meta?.validation,
				customValidationMessage: validationError.validation_message ?? field?.meta?.validation_message,
			};

			function getFieldName() {
				if (!field) return validationError.field;
				if (functionName) return formatFieldFunction(field.collection, validationError.field);
				return field.name;
			}

			function getNestedFieldNames(nestedFieldKeys: string[], nestedNames?: Record<string, string>) {
				if (!nestedFieldKeys?.length) return '';
				const separator = ' → ';
				return `${separator}${nestedFieldKeys.map((name) => nestedNames?.[name] ?? name).join(separator)}`;
			}
		},
	) as ValidationErrorWithDetails[];
});

function getDefaultValidationMessage(validationError: ValidationError) {
	const isNotUnique = validationError.code === 'RECORD_NOT_UNIQUE';
	if (isNotUnique) return t('validationError.unique', validationError);

	return t(`validationError.${validationError.type}`, validationError);
}

function showCustomValidationMessage(validationError: ValidationErrorWithDetails) {
	return (
		validationError.customValidationMessage &&
		(!validationError.hasCustomValidation || validationError.code === 'FAILED_VALIDATION')
	);
}
</script>

<template>
	<v-notice type="danger" class="full">
		<div>
			<p>{{ t('validation_errors_notice') }}</p>
			<ul class="validation-errors-list">
				<li v-for="(validationError, index) of validationErrorsWithDetails" :key="index" class="validation-error">
					<strong class="field" @click="$emit('scroll-to-field', validationError.group || validationError.field)">
						<template v-if="validationError.field && validationError.hidden && validationError.group">
							{{
								`${validationError.fieldName} (${t('hidden_in_group', {
									group: validationError.groupName,
								})})`
							}}
						</template>
						<template v-else-if="validationError.field && validationError.hidden">
							{{ `${validationError.fieldName} (${t('hidden')})` }}
						</template>
						<template v-else-if="validationError.field">{{ validationError.fieldName }}</template>
					</strong>
					<strong>{{ ': ' }}</strong>

					<template v-if="showCustomValidationMessage(validationError)">
						{{ validationError.customValidationMessage }}
						<v-icon v-tooltip="getDefaultValidationMessage(validationError)" small right name="help" />
					</template>

					<template v-else>{{ getDefaultValidationMessage(validationError) }}</template>
				</li>
			</ul>
		</div>
	</v-notice>
</template>

<style lang="scss" scoped>
.validation-errors-list {
	margin-block-start: 4px;
	padding-inline-start: 28px;

	.field {
		cursor: pointer;

		&:hover {
			text-decoration: underline;
		}
	}

	.validation-error .v-icon {
		vertical-align: text-top;
		margin-inline-start: 0 !important;
	}

	li:not(:last-child) {
		margin-block-end: 4px;
	}
}
</style>
