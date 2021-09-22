/**
 * Utils handler
 */

import { ITransport } from '../transport';
import { ID } from '../types';

export class UtilsHandler {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	random = {
		string: async (length = 32): Promise<string> => {
			const result = await this.transport.get<string>('/utils/random/string', { params: { length } });
			return result.data!;
		},
	};

	hash = {
		generate: async (string: string): Promise<string> => {
			const result = await this.transport.post<string>('/utils/hash/generate', { string });
			return result.data!;
		},
		verify: async (string: string, hash: string): Promise<boolean> => {
			const result = await this.transport.post<boolean>('/utils/hash/verify', { string, hash });
			return result.data!;
		},
	};

	async sort(collection: string, item: ID, to: ID): Promise<void> {
		await this.transport.post(`/utils/sort/${encodeURI(collection as string)}`, { item, to });
	}

	async revert(revision: ID): Promise<void> {
		await this.transport.post(`/utils/revert/${encodeURI(revision as string)}`);
	}
}
