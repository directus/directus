import { AuthStorage } from '../types';

export class MemoryStore implements AuthStorage {
	private values: Record<string, any> = {};

	async getItem(key: string) {
		return this.values[key];
	}

	async setItem(key: string, value: any) {
		this.values[key] = value;
	}
}
