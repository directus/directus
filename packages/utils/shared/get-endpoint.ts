import { isSystemCollection } from '@directus/system-data';

const ENDPOINT_OVERRIDES: Record<string, string> = {
	directus_oauth_clients: '/mcp-oauth/clients',
};

export function getEndpoint(collection: string): string {
	if (collection in ENDPOINT_OVERRIDES) {
		return ENDPOINT_OVERRIDES[collection]!;
	}

	if (isSystemCollection(collection)) {
		return `/${collection.substring(9)}`;
	}

	return `/items/${collection}`;
}
