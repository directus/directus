import { createHash } from 'node:crypto';
import { useEnv } from '@directus/env';
import { InvalidLicenseConfigError } from '@directus/errors';
import { getProjectId } from '../utils/get-project-id.js';

export function normalizeLicenseKey(licenseKey: string): string {
	const compact = licenseKey
		.trim()
		.toUpperCase()
		.replace(/[\s-]+/g, '');

	const canonical = compact.startsWith('DIR')
		? `DIR${compact.slice(3).replace(/O/g, '0').replace(/[IL]/g, '1')}`
		: compact.replace(/O/g, '0').replace(/[IL]/g, '1');

	if (!canonical.startsWith('DIR') || canonical.length !== 28) {
		return canonical;
	}

	return [
		'DIR',
		canonical.slice(3, 8),
		canonical.slice(8, 13),
		canonical.slice(13, 18),
		canonical.slice(18, 23),
		canonical.slice(23),
	].join('-');
}

export function normalizeOptionalLicenseKey(value: unknown): string | null {
	if (typeof value !== 'string') return null;

	const licenseKey = normalizeLicenseKey(value);
	return licenseKey === '' ? null : licenseKey;
}

export function hashLicenseKey(licenseKey: string): string {
	return createHash('sha256').update(normalizeLicenseKey(licenseKey)).digest('hex');
}

export async function resolveProjectId(projectId?: string): Promise<string> {
	if (projectId) return projectId;

	const stored = await getProjectId();

	if (!stored) {
		throw new InvalidLicenseConfigError({ reason: 'project_id is missing or not a string' });
	}

	return stored;
}

export function resolvePublicUrl(publicUrl?: string): string {
	if (publicUrl) return publicUrl;

	const envPublicUrl = useEnv()['PUBLIC_URL'];

	if (typeof envPublicUrl !== 'string' || !envPublicUrl) {
		throw new InvalidLicenseConfigError({ reason: 'PUBLIC_URL is missing or not a string' });
	}

	return envPublicUrl;
}
