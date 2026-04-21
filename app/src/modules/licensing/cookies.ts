import {
	LICENSE_BANNER_DISMISSED_COOKIE,
	LICENSING_COOKIE_OPTIONS,
	ONBOARDING_GRACE_POPUP_SKIPPED_COOKIE,
} from './constants';

export const LICENSING_SESSION_COOKIES = [LICENSE_BANNER_DISMISSED_COOKIE, ONBOARDING_GRACE_POPUP_SKIPPED_COOKIE];

type WritableCookies = {
	set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

export function setLicenseBannerDismissed(cookies: WritableCookies, expires: Date) {
	cookies.set(LICENSE_BANNER_DISMISSED_COOKIE, 'true', {
		...LICENSING_COOKIE_OPTIONS,
		expires,
	});
}

export function setOnboardingGracePopupSkipped(cookies: WritableCookies) {
	cookies.set(ONBOARDING_GRACE_POPUP_SKIPPED_COOKIE, 'true', LICENSING_COOKIE_OPTIONS);
}

export function clearLicensingSessionCookies() {
	if (typeof document === 'undefined') return;

	for (const cookieName of LICENSING_SESSION_COOKIES) {
		document.cookie = [`${encodeURIComponent(cookieName)}=`, 'Max-Age=0', `Path=${LICENSING_COOKIE_OPTIONS.path}`].join(
			'; ',
		);
	}
}
