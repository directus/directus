import { AuthStorage } from '../types';

export class BrowserStore implements AuthStorage {
	async getItem(key: string): Promise<string | null> {
		return window.localStorage.getItem(key);
	}

	async setItem(key: string, value: any): Promise<void> {
		window.localStorage.setItem(key, value);
	}

	async removeItem(key: string): Promise<void> {
		window.localStorage.removeItem(key);
	}
}
