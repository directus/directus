import { IStorage } from '../../storage';

export abstract class BaseStorage implements IStorage {
	get auth_token(): string | null {
		return this.get('auth_token');
	}

	set auth_token(value: string | null) {
		if (value === null) {
			this.delete('auth_token');
		} else {
			this.set('auth_token', value);
		}
	}

	get auth_expires_at(): number | null {
		const value = this.get('auth_expires_at');
		if (value === null) {
			return null;
		}
		return parseInt(value);
	}

	set auth_expires_at(value: number | null) {
		if (value === null) {
			this.delete('auth_expires_at');
		} else {
			this.set('auth_expires_at', value!.toString());
		}
	}

	get auth_refresh_token(): string | null {
		return this.get('auth_refresh_token');
	}

	set auth_refresh_token(value: string | null) {
		if (value === null) {
			this.delete('auth_refresh_token');
		} else {
			this.set('auth_refresh_token', value);
		}
	}

	abstract get(key: string): string | null;
	abstract set(key: string, value: string): string;
	abstract delete(key: string): string | null;
}
