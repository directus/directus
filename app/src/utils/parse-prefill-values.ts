import { LocationQuery } from 'vue-router';

/**
 * Parse URL query parameters for form field prefilling
 * Extracts values from parameters in the format: val[field]=value
 *
 * @param query - The route query object from vue-router
 * @returns Record of field names to their prefill values
 *
 * @example
 * // URL: /content/users/+?val[first_name]=Bob&val[last_name]=Barker
 * // Returns: { first_name: 'Bob', last_name: 'Barker' }
 */
export function parsePrefillValues(query: LocationQuery): Record<string, any> {
	const prefillValues: Record<string, any> = {};

	for (const [key, value] of Object.entries(query)) {
		// Match parameters like val[field_name]
		const match = key.match(/^val\[(.+)\]$/);

		if (match && match[1]) {
			const fieldName = match[1];

			// Handle array values (query parameter can be an array)
			if (Array.isArray(value)) {
				// Use the first value if multiple values are provided
				prefillValues[fieldName] = value[0];
			} else {
				prefillValues[fieldName] = value;
			}
		}
	}

	return prefillValues;
}
