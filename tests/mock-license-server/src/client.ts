import type { MockLicense } from './types.js';

export async function registerLicense(base: string, license: MockLicense) {
	const res = await fetch(`${base}/admin/license`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(license),
	});

	if (!res.ok) throw new Error(`registerLicense failed: ${res.status} ${await res.text()}`);
}
