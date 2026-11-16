import { createKnex } from '@directus/sandbox';
import { type Column, createInspector } from '@directus/schema';
import { customEndpoint, type DirectusClient, queryToParams, readItems, type RestClient } from '@directus/sdk';
import { env, options, port } from '@utils/constants.js';

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

// Version tables aren't exposed through the API, so they are inspected in the database directly
const inspector = createInspector(createKnex(env, options));

/**
 * Names of the columns of a table, or null if the table doesn't exist
 */
export async function getColumns(table: string): Promise<string[] | null> {
	if (!(await inspector.hasTable(table))) return null;

	return (await inspector.columnInfo(table)).map((column) => column.name).sort();
}

export async function getColumn(table: string, column: string): Promise<Column> {
	return inspector.columnInfo(table, column);
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
