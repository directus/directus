import { BaseStorage } from './base';

export class MemoryStorage extends BaseStorage {
	private values: Record<string, string> = {};

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
		const value = this.get(key);
		delete this.values[this.key(key)];
		return value;
	}

	private key(name: string): string {
		return `${this.prefix}${name}`;
	}
}
