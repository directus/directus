import type { ServerLicenseInfo } from '@/types/license';

export function canManageLicense(info: ServerLicenseInfo | null | undefined): boolean {
	return info?.show_license_key_field === true && info?.source !== 'env';
}

export function isEnvOfflineLicense(info: ServerLicenseInfo | null | undefined): boolean {
	return info?.source === 'env' && info?.refresh_interval === 0 && info?.entitlements.offline_enabled === true;
}
