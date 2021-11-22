import { IStorage } from '../../storage';

export type StorageOptions = {
	prefix?: string;
};

const KEY_AUTH_TOKEN: string = 'auth_token';
const KEY_AUTH_REFRESH_TOKEN: string = 'auth_refresh_token';
const KEY_AUTH_EXPIRES: string = 'auth_token';

export abstract class BaseStorage extends IStorage {
	protected prefix: string;

	get auth_token(): string | null {
		return this.get(KEY_AUTH_TOKEN);
	}

	set auth_token(value: string | null) {
		if (value === null) {
			this.delete(KEY_AUTH_TOKEN);
		} else {
			this.set(KEY_AUTH_TOKEN, value);
		}
	}

	get auth_expires(): number | null {
		const value = this.get(KEY_AUTH_EXPIRES);
		if (value === null) {
			return null;
		}
		return parseInt(value);
	}

	set auth_expires(value: number | null) {
		if (value === null) {
			this.delete(KEY_AUTH_EXPIRES);
		} else {
			this.set(KEY_AUTH_EXPIRES, value!.toString());
		}
	}

	get auth_refresh_token(): string | null {
		return this.get(KEY_AUTH_REFRESH_TOKEN);
	}

	set auth_refresh_token(value: string | null) {
		if (value === null) {
			this.delete(KEY_AUTH_REFRESH_TOKEN);
		} else {
			this.set(KEY_AUTH_REFRESH_TOKEN, value);
		}
	}

	abstract get(key: string): string | null;
	abstract set(key: string, value: string): string;
	abstract delete(key: string): string | null;

	constructor(options?: StorageOptions) {
		super();

		this.prefix = options?.prefix ?? '';
	}
}
