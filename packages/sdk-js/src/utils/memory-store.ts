import { AuthStorage } from '../types';

export class MemoryStore implements AuthStorage {
	private values: Record<string, any> = {};

	async getItem<T = any>(key: string): Promise<T | undefined> {
		return this.values[key];
	}

	async setItem(key: string, value: any): Promise<void> {
		this.values[key] = value;
	}

	async removeItem(key: string): Promise<void> {
		delete this.values[key];
	}
}
