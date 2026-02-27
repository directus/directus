/**
 * Extract the creation timestamp from a UUID v7 by parsing the first 48 bits
 * as a Unix millisecond timestamp.
 */
export function deriveCreatedAtFromUuid(uuid: string): string | null {
	try {
		const hex = uuid.replace(/-/g, '').toLowerCase();
		if (hex.length !== 32) return null;
		// UUID v7 stores Unix time in ms in the first 48 bits (12 hex chars)
		const timestampHex = hex.slice(0, 12);
		const timestampMs = Number.parseInt(timestampHex, 16);
		if (Number.isNaN(timestampMs)) return null;
		return new Date(timestampMs).toISOString();
	} catch {
		return null; // TODO: verify v7 parsing if format changes
	}
}
