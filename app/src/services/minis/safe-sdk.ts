import sdk from '@/sdk';
import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';

export interface RequestOptions {
	method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
	body?: unknown;
	params?: Record<string, unknown>;
	headers?: Record<string, string>;
}

export interface SafeSDK {
	/** Read multiple items from a collection */
	readItems(collection: string, query?: Record<string, unknown>): Promise<unknown[]>;

	/** Read a single item from a collection */
	readItem(collection: string, id: string, query?: Record<string, unknown>): Promise<unknown>;

	/** Create a new item in a collection */
	createItem(collection: string, data: Record<string, unknown>): Promise<unknown>;

	/** Update an existing item in a collection */
	updateItem(collection: string, id: string, data: Record<string, unknown>): Promise<unknown>;

	/** Delete an item from a collection */
	deleteItem(collection: string, id: string): Promise<void>;

	/** Make a custom request to a relative path within the Directus instance */
	request(path: string, options?: RequestOptions): Promise<unknown>;

	/** Configuration passed from the panel instance */
	config?: Record<string, any>;

	/** Dashboard interop functions */
	dashboard?: {
		getVariable(name: string): any;
		setVariable(name: string, value: any): void;
	};
}

/**
 * Validates that a path is safe (relative, no absolute URLs)
 */
function validatePath(path: string): string {
	// Block absolute URLs
	if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
		throw new Error('Absolute URLs are not allowed in minis. Use relative paths only.');
	}

	// Ensure path starts with /
	if (!path.startsWith('/')) {
		path = '/' + path;
	}

	// Block path traversal attempts
	if (path.includes('..')) {
		throw new Error('Path traversal is not allowed.');
	}

	return path;
}

/**
 * Creates a safe SDK wrapper that restricts access to the current Directus instance only.
 * All requests go through the authenticated session and respect user permissions.
 */
export function createSafeSDK(options?: {
	config?: Record<string, any>;
	dashboard?: {
		getVariable(name: string): any;
		setVariable(name: string, value: any): void;
	};
}): SafeSDK {
	return {
		config: options?.config,
		dashboard: options?.dashboard,

		async readItems(collection: string, query?: Record<string, unknown>): Promise<unknown[]> {
			if (!collection || typeof collection !== 'string') {
				throw new Error('Collection name must be a non-empty string');
			}

			const result = await sdk.request(readItems(collection, query));
			return result as unknown[];
		},

		async readItem(collection: string, id: string, query?: Record<string, unknown>): Promise<unknown> {
			if (!collection || typeof collection !== 'string') {
				throw new Error('Collection name must be a non-empty string');
			}

			if (!id || typeof id !== 'string') {
				throw new Error('Item ID must be a non-empty string');
			}

			return sdk.request(readItem(collection, id, query));
		},

		async createItem(collection: string, data: Record<string, unknown>): Promise<unknown> {
			if (!collection || typeof collection !== 'string') {
				throw new Error('Collection name must be a non-empty string');
			}

			if (!data || typeof data !== 'object') {
				throw new Error('Data must be an object');
			}

			return sdk.request(createItem(collection, data));
		},

		async updateItem(collection: string, id: string, data: Record<string, unknown>): Promise<unknown> {
			if (!collection || typeof collection !== 'string') {
				throw new Error('Collection name must be a non-empty string');
			}

			if (!id || typeof id !== 'string') {
				throw new Error('Item ID must be a non-empty string');
			}

			if (!data || typeof data !== 'object') {
				throw new Error('Data must be an object');
			}

			return sdk.request(updateItem(collection, id, data));
		},

		async deleteItem(collection: string, id: string): Promise<void> {
			if (!collection || typeof collection !== 'string') {
				throw new Error('Collection name must be a non-empty string');
			}

			if (!id || typeof id !== 'string') {
				throw new Error('Item ID must be a non-empty string');
			}

			await sdk.request(deleteItem(collection, id));
		},

		async request(path: string, options?: RequestOptions): Promise<unknown> {
			// Validate and sanitize the path
			const safePath = validatePath(path);

			// Build the request
			return sdk.request(() => ({
				path: safePath,
				method: options?.method ?? 'GET',
				body: options?.body ? JSON.stringify(options.body) : undefined,
				params: options?.params as Record<string, string> | undefined,
				headers: options?.headers,
			}));
		},
	};
}
