import { createError } from '@directus/errors';

export const SSO_DRIVERS = ['oauth2', 'openid', 'saml'] as const;
export const EXTERNAL_AUTH_DRIVERS = [...SSO_DRIVERS, 'ldap'] as const;

export const SSO_DISABLED_REASON = 'SSO_DISABLED';
export const SSO_NON_ADMIN_REASON = 'SSO_NON_ADMIN';

export const SsoNonAdminError = createError(SSO_NON_ADMIN_REASON, 'SSO is only available for administrators.', 403);

export function isSSODriver(driver: string | undefined): driver is (typeof SSO_DRIVERS)[number] {
	return typeof driver === 'string' && SSO_DRIVERS.includes(driver as (typeof SSO_DRIVERS)[number]);
}

export function isExternalAuthDriver(driver: string | undefined): driver is (typeof EXTERNAL_AUTH_DRIVERS)[number] {
	return typeof driver === 'string' && EXTERNAL_AUTH_DRIVERS.includes(driver as (typeof EXTERNAL_AUTH_DRIVERS)[number]);
}
