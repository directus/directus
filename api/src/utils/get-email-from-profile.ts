import { get } from 'lodash';
import env from '../env';
import { ServiceUnavailableException } from '../exceptions';

// The path in JSON to fetch the email address from the profile.
// Note: a lot of services use `email` as the path. We fall back to that as default, so no need to
// map it here
const profileMap: Record<string, string> = {};

/**
 * Extract the email address from a given user profile coming from a providers API
 *
 * Falls back to OAUTH_<PROVIDER>_PROFILE_EMAIL if we don't have it preconfigured yet, and defaults
 * to `email` if nothing is set
 *
 * This is used in the SSO flow to extract the users
 */
export default function getEmailFromProfile(provider: string, profile: Record<string, any>): string {
	const path = profileMap[provider] || env[`OAUTH_${provider.toUpperCase()}_PROFILE_EMAIL`] || 'email';

	const email = get(profile, path);

	if (!email) {
		throw new ServiceUnavailableException("Couldn't extract email address from SSO provider response", {
			service: 'oauth',
			provider,
		});
	}

	return email;
}
