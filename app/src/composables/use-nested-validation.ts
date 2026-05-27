import { isEmpty } from 'lodash';
import { computed, inject, provide, ref } from 'vue';

const nestedValidationSymbol = 'nestedValidation';

export function useNestedValidation() {
	const nestedValidationErrorsPerField = ref<Record<string, any>>({});
	const nestedValidationErrors = computed(getNestedValidationErrors);

	provide(nestedValidationSymbol, { updateNestedValidationErrors });

	return { nestedValidationErrors, resetNestedValidationErrors };

	function updateNestedValidationErrors(fieldKey: string, errors: any[]) {
		nestedValidationErrorsPerField.value[fieldKey] = errors;
	}

	function getNestedValidationErrors() {
		return Object.entries(nestedValidationErrorsPerField.value)?.flatMap(([_field, errors]) =>
			!isEmpty(errors) ? errors : [],
		);
	}

	function resetNestedValidationErrors() {
		nestedValidationErrorsPerField.value = {};
	}
}

export function useInjectNestedValidation() {
	return inject(nestedValidationSymbol, {
		updateNestedValidationErrors: (_field: string, _validationErrors: any[]) => {},
	});
}
