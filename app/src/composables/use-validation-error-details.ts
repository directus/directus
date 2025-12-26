import { extractFieldFromFunction } from '@/utils/extract-field-from-function';
import { formatFieldFunction } from '@/utils/format-field-function';
import { parseValidationStructure, hasNestedGroups } from '@/utils/format-validation-structure';
import { Field, ValidationError } from '@directus/types';
import { computed, Ref } from 'vue';
import { useI18n } from 'vue-i18n';

export type ValidationErrorWithDetails = ValidationError & {
	fieldName?: string;
	groupName?: string;
	type: ValidationError['type'] | 'required' | 'unique';
	customValidationMessage: string | null;
	validationStructure?: ReturnType<typeof parseValidationStructure>;
	hasNestedValidation: boolean;
};

export function useValidationErrorDetails(validationErrors: Ref<ValidationError[]>, fields: Ref<Field[]>) {
	const { t } = useI18n();

	const validationErrorsWithDetails = computed<ValidationErrorWithDetails[]>(() => {
		return validationErrors.value.map(
			(validationError: ValidationError & { nestedNames?: Record<string, string>; validation_message?: string }) => {
				const { field: _fieldKey, fn: functionName } = extractFieldFromFunction(validationError.field);
				const [fieldKey, ...nestedFieldKeys] = _fieldKey.split('.');
				const field = fields.value.find((field) => field.field === fieldKey);
				const groupFieldKey = validationError.group ?? field?.meta?.group;
				const group = groupFieldKey ? fields.value.find((f) => f.field === groupFieldKey) : null;
				const fieldName = getFieldName() + getNestedFieldNames(nestedFieldKeys, validationError.nestedNames);
				const isRequiredError = field?.meta?.required && validationError.type === 'nnull';
				const isNotUniqueError = validationError.code === 'RECORD_NOT_UNIQUE';

				const validationStructure = field?.meta?.validation ? parseValidationStructure(field.meta.validation) : null;
				const hasNestedValidation = field?.meta?.validation ? hasNestedGroups(field.meta.validation) : false;

				return {
					...validationError,
					hidden: validationError.hidden ?? field?.meta?.hidden,
					field: fieldKey!,
					fieldName,
					groupName: group?.name ?? groupFieldKey,
					type: getValidationType(),
					customValidationMessage: getCustomValidationMessage(),
					validationStructure,
					hasNestedValidation,
				} as ValidationErrorWithDetails;

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

				function getValidationType() {
					if (isRequiredError) return 'required';
					if (isNotUniqueError) return 'unique';
					return validationError.type;
				}

				function getCustomValidationMessage() {
					const customValidationMessage = validationError.validation_message ?? field?.meta?.validation_message;
					if (!customValidationMessage) return null;

					const hasCustomValidation = !!field?.meta?.validation;
					if (hasCustomValidation && (isRequiredError || isNotUniqueError)) return null;

					return customValidationMessage;
				}
			},
		);
	});

	function getDefaultValidationMessage(validationError: ValidationErrorWithDetails) {
		return t(`validationError.${validationError.type}`, validationError);
	}

	return {
		validationErrorsWithDetails,
		getDefaultValidationMessage,
	};
}
