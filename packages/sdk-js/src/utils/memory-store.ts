export class MemoryStore {
	values: Record<string, any> = {};

	async get(key: string) {
		return this.values[key];
	}

	async set(key: string, value: any) {
		this.values[key] = value;
	}
}
