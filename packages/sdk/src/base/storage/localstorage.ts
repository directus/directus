import { BaseStorage } from '@/src/base/storage/base.js';

export class LocalStorage extends BaseStorage {
	private prefix: string;

	constructor(prefix = '') {
		super();
		this.prefix = prefix;
	}

	get(key: string): string | null {
		const value = localStorage.getItem(this.key(key));
		if (value !== null) {
			return value;
		}
		return null;
	}

	set(key: string, value: string): string {
		localStorage.setItem(this.key(key), value);
		return value;
	}

	delete(key: string): string | null {
		const k = this.key(key);
		const value = this.get(k);
		if (value) {
			localStorage.removeItem(k);
		}
		return value;
	}

	private key(name: string): string {
		return `${this.prefix}${name}`;
	}
}
