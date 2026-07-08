export function toFormUrlEncoded(obj: Record<string, string>, options?: { sort: boolean }) {
	let entries = Object.entries(obj);

	if (options?.sort) {
		entries = entries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
	}

	return decodeURIComponent(new URLSearchParams(entries).toString());
}

export function toSignatureString(obj: Record<string, string>) {
	return Object.entries(obj)
		.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
		.map(([key, value]) => `${key}=${value}`)
		.join('&');
}
