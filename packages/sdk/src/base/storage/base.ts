import { IStorage } from '../../storage';

export type StorageOptions = {
	prefix?: string;
};

enum Keys {
	AuthToken = 'auth_token',
	RefreshToken = 'auth_refresh_token',
	Expires = 'auth_expires',
}

export abstract class BaseStorage extends IStorage {
	protected prefix: string;

	get auth_token(): string | null {
		return this.get(Keys.AuthToken);
	}

	set auth_token(value: string | null) {
		if (value === null) {
			this.delete(Keys.AuthToken);
		} else {
			this.set(Keys.AuthToken, value);
		}
	}

	get auth_expires(): number | null {
		const value = this.get(Keys.Expires);
		if (value === null) {
			return null;
		}
		return parseInt(value);
	}

	set auth_expires(value: number | null) {
		if (value === null) {
			this.delete(Keys.Expires);
		} else {
			this.set(Keys.Expires, value!.toString());
		}
	}

	get auth_refresh_token(): string | null {
		return this.get(Keys.RefreshToken);
	}

	set auth_refresh_token(value: string | null) {
		if (value === null) {
			this.delete(Keys.RefreshToken);
		} else {
			this.set(Keys.RefreshToken, value);
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
