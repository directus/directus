import env from './env';
import { toArray } from './utils/to-array';
import { Issuer } from 'openid-client';

// oAuth 2 /////////////////////////////////////////////////////////////////////////////////////////
const authProviders = toArray(env.AUTH_PROVIDERS).map((provider) => provider.toLowerCase());

export const oauthConfig: any = {
	defaults: {
		origin: env.PUBLIC_URL,
		transport: 'session',
		prefix: '/auth/oauth',
		response: ['tokens', 'profile'],
	},
};

for (const [key, value] of Object.entries(env)) {
	if (key.startsWith('OAUTH') === false) continue;

	const parts = key.split('_');
	const provider = parts[1].toLowerCase();

	if (authProviders.includes(provider) === false) continue;

	// OAUTH <PROVIDER> SETTING = VALUE
	parts.splice(0, 2);

	const configKey = parts.join('_').toLowerCase();

	oauthConfig[provider] = {
		...(oauthConfig[provider] || {}),
		[configKey]: value,
	};
}

// Open-ID Connect (OICD) //////////////////////////////////////////////////////////////////////////
export async function registerOIDC() {}
