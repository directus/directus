import { get } from 'lodash';

// The path in JSON to fetch the email address from the profile.
const profileMap = {
	github: 'email',
};

/**
 * Extract the email address from a given user profile coming from a providers API
 *
 * Falls back to OAUTH_<PROVIDER>_PROFILE_EMAIL if we don't have it preconfigured yet
 *
 * This is used in the SSO flow to extract the users
 */
export default function getEmailFromProfile(provider: string, profile: Record<string, any>) {
	const path =
		profileMap[provider] || process.env[`OAUTH_${provider.toUpperCase()}_PROFILE_EMAIL`];

	if (!path) {
		throw new Error('Path to email in profile object is unknown.');
	}

	return get(profile, path);
}
