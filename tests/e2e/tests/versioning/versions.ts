import {
	customEndpoint,
	type DirectusClient,
	queryToParams,
	readFieldsByCollection,
	readItems,
	type RestClient,
} from '@directus/sdk';
import { port } from '@utils/constants.js';

type Client = DirectusClient<any> & RestClient<any>;
type VersionQuery = Record<string, any>;

export const SHADOW = 'directus_shadow_';
export const LINK = 'directus_link_';

/**
 * Requests against the `/versions/:collection` endpoints, which the SDK doesn't provide commands for
 */
export function useVersions(client: Client) {
	const request = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown, query?: VersionQuery) =>
		client.request<any>(
			customEndpoint({
				method,
				path: `/versions/${path}`,
				...(body !== undefined ? { body: JSON.stringify(body) } : {}),
				...(query ? { params: queryToParams(query as any) } : {}),
			}),
		);

	return {
		create: (collection: string, data: Record<string, unknown>, query?: VersionQuery) =>
			request('POST', collection, data, query),
		update: (collection: string, id: number, data: Record<string, unknown>, query?: VersionQuery) =>
			request('PATCH', `${collection}/${id}`, data, query),
		delete: (collection: string, id: number) => request('DELETE', `${collection}/${id}`),
		publish: (collection: string, id: number, body: Record<string, unknown> = {}, query?: VersionQuery) =>
			request('POST', `${collection}/${id}/publish`, body, query),
		unpublish: (collection: string, id: number, query?: VersionQuery) =>
			request('DELETE', `${collection}/${id}/publish`, undefined, query),
		archive: (collection: string, id: number, query?: VersionQuery) =>
			request('POST', `${collection}/${id}/archive`, {}, query),
	};
}

/**
 * Read a single version through the items endpoint. Published versions are represented by their live item.
 */
export async function readVersion(
	client: Client,
	collection: string,
	id: number,
	fields: string[] = ['*', 'directus_version.*'],
) {
	const [item] = await client.request(
		readItems(collection, { version: 'true', filter: { directus_version: { id: { _eq: id } } }, fields } as any),
	);

	return item as Record<string, any> | undefined;
}

/**
 * Names of the columns of a table, or null if the table doesn't exist
 */
export async function getColumns(client: Client, table: string): Promise<string[] | null> {
	try {
		const fields = await client.request(readFieldsByCollection(table));
		return fields.length > 0 ? fields.map((field: any) => field.field as string).sort() : null;
	} catch {
		return null;
	}
}

/**
 * Read items with the response meta, which the SDK drops
 */
export async function readWithMeta(token: string, collection: string, query: VersionQuery) {
	const params = new URLSearchParams(queryToParams(query as any) as Record<string, string>);

	const response = await fetch(`http://localhost:${port}/items/${collection}?${params}`, {
		headers: { Authorization: `Bearer ${token}` },
	});

	return (await response.json()) as { data: any[]; meta: Record<string, number> };
}
