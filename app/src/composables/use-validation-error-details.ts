import { extractFieldFromFunction } from "@/utils/extract-field-from-function";
import { formatFieldFunction } from "@/utils/format-field-function";
import { Field, ValidationError } from "@directus/types";
import { computed, Ref, toRef } from "vue";

export type ValidationErrorWithDetails = ValidationError & {
  fieldName?: string;
  groupName?: string;
  customValidationMessage: string | null;
};

export function useValidationErrorDetails(
  validationErrors: Ref<ValidationError[]> | ValidationError[],
  fields: Field[],
  t: (key: string, values?: any) => string
) {

  const validationErrorsWithDetails = computed<ValidationErrorWithDetails[]>(() => {
    return toRef(validationErrors).value.map(
      (validationError: ValidationError & { nestedNames?: Record<string, string>; validation_message?: string }) => {
        const { field: _fieldKey, fn: functionName } = extractFieldFromFunction(validationError.field);
        const [fieldKey, ...nestedFieldKeys] = _fieldKey.split('.');
        const field = fields.find((field) => field.field === fieldKey);
        const group = fields.find((field) => field.field === validationError.group);
        const fieldName = getFieldName() + getNestedFieldNames(nestedFieldKeys, validationError.nestedNames);
        const isRequiredError = field?.meta?.required && validationError.type === 'nnull';
        const isNotUniqueError = validationError.code === 'RECORD_NOT_UNIQUE';

        return {
          ...validationError,
          field: fieldKey!,
          fieldName,
          groupName: group?.name ?? validationError.group,
          type: getValidationType(),
          customValidationMessage: getCustomValidationMessage(),
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
      });
  });

  function getDefaultValidationMessage(validationError: ValidationErrorWithDetails) {
    return t(`validationError.${validationError.type}`, validationError);
  }

  return {
    validationErrorsWithDetails,
    getDefaultValidationMessage,
  };
}