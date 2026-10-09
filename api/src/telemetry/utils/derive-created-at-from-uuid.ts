export function deriveCreatedAtFromUuid(uuid: string): string | null {
	try {
		const hex = uuid.replace(/-/g, '').toLowerCase();
		if (hex.length !== 32) return null;
		const timestampHex = hex.slice(0, 12);
		const timestampMs = Number.parseInt(timestampHex, 16);
		if (Number.isNaN(timestampMs)) return null;
		return new Date(timestampMs).toISOString();
	} catch {
		return null;
	}
}
