/**
 * Check if a specific field is allowed within a set of allowed fields
 */
export function isFieldAllowed(allowedFields: string[] | Set<string>, field: string): boolean {
	if (Array.isArray(allowedFields)) {
		return allowedFields.includes(field) || allowedFields.includes('*');
	}

	return allowedFields.has(field) || allowedFields.has('*');
}
