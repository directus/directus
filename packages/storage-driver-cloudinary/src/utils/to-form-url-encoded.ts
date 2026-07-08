/**
 * Serialize a payload into an `application/x-www-form-urlencoded` string for use as a request body.
 *
 * @param obj - Payload to serialize
 * @param options - Serialization options
 * @param options.sort - Whether to sort entries alphabetically by key
 * @returns The form-url-encoded string
 */
export function toFormUrlEncoded(obj: Record<string, string>, options?: { sort: boolean }) {
	let entries = Object.entries(obj);

	if (options?.sort) {
		entries = entries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
	}

	return decodeURIComponent(new URLSearchParams(entries).toString());
}
