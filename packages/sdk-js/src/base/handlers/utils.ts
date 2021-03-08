/**
 * Utils handler
 */

import { ID } from '../../items';
import { ITransport } from '../../transport';

export class UtilsHandler {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	random = {
		string: async (length: number = 32): Promise<{ data: string }> => {
			const result = await this.transport.get('/utils/random/string', { params: { length } });
			return result.data;
		},
	};

	hash = {
		generate: async (string: string): Promise<{ data: string }> => {
			const result = await this.transport.post('/utils/hash/generate', { string });
			return result.data;
		},
		verify: async (string: string, hash: string): Promise<{ data: boolean }> => {
			const result = await this.transport.post('/utils/hash/verify', { string, hash });
			return result.data;
		},
	};

	async sort(collection: string, item: ID, to: ID): Promise<void> {
		await this.transport.post(`/utils/sort/${collection}`, { item, to });
	}

	async revert(revision: ID): Promise<void> {
		await this.transport.post(`/utils/revert/${revision}`);
	}
}
