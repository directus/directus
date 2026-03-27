import { classifyIssuer } from './classify-issuer.js';

const urlSuffixByDriver: Record<string, string> = {
	oauth2: 'AUTHORIZE_URL',
	openid: 'ISSUER_URL',
	ldap: 'CLIENT_URL',
};

export function detectIssuer(env: Record<string, unknown>, providerName: string, driver: string): string | null {
	const suffix = urlSuffixByDriver[driver];
	if (!suffix) return null;

	const value = env[`AUTH_${providerName.toUpperCase()}_${suffix}`] as string | undefined;
	return classifyIssuer(value);
}
