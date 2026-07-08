import { DEPLOYMENT_PROVIDER_TYPES, type ProviderType } from '@directus/types';

export function validateProvider(provider: string): provider is ProviderType {
	return DEPLOYMENT_PROVIDER_TYPES.includes(provider as ProviderType);
}
