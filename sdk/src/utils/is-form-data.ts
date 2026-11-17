/**
 * Type guard to check if a value is a FormData instance, safe in runtimes without a global FormData
 */
export function isFormData(value: unknown): value is FormData {
	return typeof FormData !== 'undefined' && value instanceof FormData;
}
