/**
 * @param provider Use a specific authentication provider
 * @param share Whether to authenticate as a share
 * @returns The endpoint to be used for authentication
 */
export function getAuthEndpoint(provider?: string, share?: boolean) {
	if (share) return '/shares/auth';
	if (provider) return `/auth/login/${provider}`;
	return '/auth/login';
}
