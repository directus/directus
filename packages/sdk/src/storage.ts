export type StorageOptions = {
	prefix?: string;
};

export abstract class IStorage {
	protected prefix: string;

	abstract auth_token: string | null;
	abstract auth_expires: number | null;
	abstract auth_refresh_token: string | null;

	abstract get(key: string): string | null;
	abstract set(key: string, value: string): string;
	abstract delete(key: string): string | null;

	constructor(options?: StorageOptions) {
		this.prefix = options?.prefix ?? '';
	}
}
