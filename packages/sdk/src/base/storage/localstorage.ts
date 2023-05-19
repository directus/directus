import { BaseStorage } from './base';

export class LocalStorage extends BaseStorage {
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
		const value = this.get(key);
		localStorage.removeItem(this.key(key));
		return value;
	}

	private key(name: string): string {
		return `${this.prefix}${name}`;
	}
}
