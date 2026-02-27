export function classifyIssuer(value?: string): string | null {
	if (!value) return null;
	const normalized = value.toLowerCase();
	const host = extractHost(normalized) ?? normalized;

	if (host.includes('auth0')) return 'auth0';
	if (host.includes('okta')) return 'okta';
	if (host.includes('cognito')) return 'cognito';
	if (host.includes('microsoftonline') || host.includes('azure')) return 'azuread';
	if (host.includes('google')) return 'google';
	if (host.includes('github')) return 'github';
	if (host.includes('gitlab')) return 'gitlab';
	if (host.includes('onelogin')) return 'onelogin';
	if (host.includes('jumpcloud')) return 'jumpcloud';
	if (host.includes('pingidentity') || host.includes('pingfed')) return 'ping';
	if (host.includes('salesforce')) return 'salesforce';
	if (host.includes('apple')) return 'apple';
	if (host.includes('facebook')) return 'facebook';
	if (host.includes('keycloak')) return 'keycloak';

	return 'other';
}

function extractHost(value: string): string | null {
	try {
		const url = value.startsWith('http') ? new URL(value) : new URL(`https://${value}`);
		return url.hostname.toLowerCase();
	} catch {
		return null;
	}
}
