/**
 * @param provider Use a specific authentication provider
 * @returns The endpoint to be used for authentication
 */
export function getAuthEndpoint(provider?: string): string {
	if (provider) return `/auth/login/${provider}`;
	return '/auth/login';
}
