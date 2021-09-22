import { BaseStorage } from './base';

export class MemoryStorage extends BaseStorage {
	private prefix: string;
	private values: Record<string, string>;

	constructor(prefix = '') {
		super();
		this.values = {};
		this.prefix = prefix;
	}

	get(key: string): string | null {
		const k = this.key(key);
		if (k in this.values) {
			return this.values[k]!;
		}
		return null;
	}

	set(key: string, value: string): string {
		this.values[this.key(key)] = value;
		return value;
	}

	delete(key: string): string | null {
		const k = this.key(key);
		const value = this.get(key);
		if (k in this.values) {
			delete this.values[k];
		}
		return value;
	}

	private key(name: string): string {
		return `${this.prefix}${name}`;
	}
}
