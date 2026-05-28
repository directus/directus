import { LICENSE_API_VERSION } from '@directus/license';
import type { MockLicense } from './types.js';

export async function registerLicense(base: string, license: MockLicense) {
	const res = await fetch(`${base}/admin/license`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(license),
	});

	if (!res.ok) throw new Error(`registerLicense failed: ${res.status} ${await res.text()}`);
}

export async function activateKey(
	base: string,
	body: { license_key: string; project_id: string; public_url: string },
): Promise<{ token: string; new_project_id?: string }> {
	const res = await fetch(`${base}/api/licenses/activate`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Directus-License-Version': LICENSE_API_VERSION,
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) throw new Error(`activateKey failed: ${res.status} ${await res.text()}`);

	return (await res.json()) as { token: string; new_project_id?: string };
}
