/**
 * Serialize a payload into the string Cloudinary signs. Values are kept verbatim (no URL-encoding)
 * so spaces survive, as the signature must match the raw parameter values Cloudinary receives.
 *
 * @param obj - Payload to serialize
 * @returns The signature string, with entries sorted alphabetically by key
 * @see https://cloudinary.com/documentation/signatures
 */
export function toSignatureString(obj: Record<string, string>) {
	return Object.entries(obj)
		.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
		.map(([key, value]) => `${key}=${value}`)
		.join('&');
}
