import { VALIDATION_TYPES } from '@/constants';
import { validateItem } from '@/utils/validate-item';
import { unexpectedError } from '@/utils/unexpected-error';
import type { Field, ContentVersion } from '@directus/types';
import { ref } from 'vue';
import { useNestedValidation } from './use-nested-validation';
import { APIErrorResponse, ValidationError } from '@/types/error';

export function useItemValidation() {
	const validationErrors = ref<ValidationError[]>([]);
	const { nestedValidationErrors } = useNestedValidation();

	function validate(
		payloadToValidate: Record<string, any>,
		fields: Field[],
		isNew = false,
		currentVersion?: ContentVersion | null,
	): ValidationError[] | null {
		validationErrors.value = [];
		const errors = validateItem(payloadToValidate, fields, isNew, false, currentVersion);

		if (nestedValidationErrors.value?.length) {
			errors.push(...nestedValidationErrors.value);
		}

		if (errors.length > 0) {
			validationErrors.value = errors;
			return errors;
		}

		return null;
	}

	function handleError(error: APIErrorResponse) {
		if (error?.response?.data?.errors) {
			validationErrors.value = error.response.data.errors
				.filter((err) => VALIDATION_TYPES.includes(err?.extensions?.code))
				.map((err) => err.extensions);

			const otherErrors = error.response.data.errors.filter((err) => !VALIDATION_TYPES.includes(err?.extensions?.code));

			if (otherErrors.length > 0) {
				otherErrors.forEach(unexpectedError);
			}
		} else {
			unexpectedError(error);
		}

		throw error;
	}

	return {
		validationErrors,
		nestedValidationErrors,
		validate,
		handleError,
	};
}
