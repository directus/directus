import { IStorage } from '@directus/sdk';
import { IConfiguration, SystemConfiguration } from '../../config';

export class InstanceStorage implements IStorage {
	private prefix: string;
	private name: string;
	private config: IConfiguration<SystemConfiguration>;

	constructor(name: string, config: IConfiguration<SystemConfiguration>, prefix = '') {
		this.name = name;
		this.config = config;
		this.prefix = prefix;
	}

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

	get auth_expires(): number | null {
		const value = this.get('auth_expires');
		if (value === null) {
			return null;
		}
		return parseInt(value);
	}

	set auth_expires(value: number | null) {
		if (value === null) {
			this.delete('auth_expires');
		} else {
			this.set('auth_expires', value!.toString());
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

	get(key: string): string | null {
		const k = this.key(key);

		if (!(this.name in this.config.data.instances)) {
			return null;
		}

		if (!this.config.data.instances[this.name]!.data) {
			return null;
		}

		if (!(k in this.config.data.instances[this.name]!.data!)) {
			return null;
		}

		return this.config.data.instances[this.name]!.data![k];
	}

	set(key: string, value: string): string {
		const k = this.key(key);

		if (!(this.name in this.config.data.instances)) {
			this.config.data.instances[this.name] = {
				auth: 'public',
				endpoint: '',
				data: {},
			};
		}

		if (!this.config.data.instances[this.name]!.data) {
			this.config.data.instances[this.name]!.data = {};
		}

		this.config.data.instances[this.name]!.data![k] = value;
		return value;
	}

	delete(key: string): string | null {
		const k = this.key(key);
		const value = this.get(key);

		if (!(this.name in this.config.data.instances)) {
			return value;
		}

		if (!this.config.data.instances[this.name]!.data) {
			return value;
		}

		if (!(k in this.config.data.instances[this.name]!.data!)) {
			return value;
		}

		delete this.config.data.instances[this.name]!.data![k];
		return value;
	}

	private key(name: string): string {
		return `${this.prefix}${name}`;
	}
}
