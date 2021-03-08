import { IStorage, StoredValue } from '../../storage';

export class MemoryStorage implements IStorage {
	private prefix: string;
	private values: Record<string, any>;

	constructor(prefix: string = '') {
		this.values = {};
		this.prefix = prefix;
	}

	async get<T extends StoredValue>(key: string): Promise<T | undefined> {
		const value = this.values[this.key(key)];
		if (value) {
			return JSON.parse(value);
		}
		return value;
	}

	async set<T extends StoredValue>(key: string, value: T): Promise<T> {
		this.values[this.key(key)] = JSON.stringify(value);
		return value;
	}

	async delete<T extends StoredValue>(key: string): Promise<T | undefined> {
		const k = this.key(key);
		const value: T | undefined = await this.get(key);
		if (k in this.values) {
			delete this.values[k];
		}
		return value;
	}

	private key(name: string): string {
		return `${this.prefix}${name}`;
	}
}
