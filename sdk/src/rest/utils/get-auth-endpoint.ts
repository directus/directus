/**
 * @param provider
 * @param share
 * @returns
 */
export function getAuthEndpoint(provider?: string, share?: boolean) {
	if (share) return '/shares/auth';
	if (provider) return `/auth/login/${provider}`;
	return '/auth/login';
}
