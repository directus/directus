import type { ImportValidationError } from '@directus/types';
import { translate } from './translate-literal';

// Use the official ImportValidationError type from @directus/types
export type ValidationErrorWithDetails = ImportValidationError;

/**
 * Format validation error message using the same logic as validation-errors.vue
 * This ensures consistency across all validation error displays in Directus
 */
export function formatValidationErrorMessage(
	validationError: ValidationErrorWithDetails,
	t: (key: string, values?: any) => string,
	te: (key: string) => boolean,
): string {
	// Handle structure errors (no field)
	if (validationError.code === 'IMPORT_STRUCTURE_ERROR') {
		return t('import_structure_error', { reason: validationError.reason });
	}

	// Priority 1: Custom validation message (like validation-errors.vue)
	if (validationError.reason && (validationError.reason.startsWith('$t:') || validationError.reason.includes('$t:'))) {
		return translate(validationError.reason);
	}

	// Priority 2: Standard validation error by type (like validation-errors.vue)
	if (te(`validationError.${validationError.type}`)) {
		return t(`validationError.${validationError.type}`, validationError);
	}

	// Priority 3: Fallback to reason or generic message
	if (validationError.reason) {
		return validationError.reason;
	}

	return t('validation_error');
}

/**
 * Format CSV validation errors with row ranges
 * Reuses the same validation logic as standard Directus forms
 */
export function formatCSVValidationErrors(
	validationErrors: ValidationErrorWithDetails[],
	t: (key: string, values?: any) => string,
	te: (key: string) => boolean,
): string {
	// Calculate total errors from count fields or fallback to array length
	const totalErrors = validationErrors.reduce((sum, error) => sum + (error.count || 1), 0);
	const summary = t('import_data_error_summary', { count: totalErrors });

	const errorMessages = validationErrors.map((validationError) => {
		const { rows: rowRanges, field, count } = validationError;

		// Use "Rows" for multiple rows, "Row" for single row
		const isMultiple = (count || 1) > 1;

		const rowPrefix = isMultiple ? `Rows ${rowRanges}:` : `Row ${rowRanges}:`;

		// Use the same validation message logic as validation-errors.vue
		const message = formatValidationErrorMessage(validationError, t, te);

		// For structure errors, don't show field name
		if (validationError.code === 'IMPORT_STRUCTURE_ERROR') {
			return `${rowPrefix} ${message}`;
		}

		return `${rowPrefix} ${field}: ${message}`;
	});

	const moreErrors = validationErrors.length > 10 ? `\n... and ${validationErrors.length - 10} more error types` : '';

	return `${summary}\n\n${errorMessages.join('\n')}${moreErrors}`;
}
