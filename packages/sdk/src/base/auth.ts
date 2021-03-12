import { AuthCredentials, AuthResult, AuthToken, IAuth } from '../auth';
import { IStorage } from '../storage';
import { ITransport } from '../transport';

export type AuthOptions = {
	mode?: 'json' | 'cookie';
};

export class Auth implements IAuth {
	public readonly options: AuthOptions;
	private transport: ITransport;
	private storage: IStorage;

	constructor(transport: ITransport, storage: IStorage, options?: AuthOptions) {
		this.options = options || {};
		this.options.mode = options?.mode || (typeof window !== 'undefined' ? 'cookie' : 'json');
		this.transport = transport;
		this.storage = storage;
	}

	get token(): string | null {
		return this.storage.auth_token;
	}

	async login(credentials: AuthCredentials): Promise<AuthResult> {
		const response = await this.transport.post<AuthResult>('/auth/login', {
			mode: this.options.mode,
			...credentials,
		});

		this.storage.auth_token = response.data!.access_token;
		this.storage.auth_refresh_token = response.data?.refresh_token || null;
		this.storage.auth_expires = response.data?.expires || null;

		return {
			access_token: response.data!.access_token,
			refresh_token: response.data?.refresh_token,
			expires: response.data!.expires,
		};
	}

	async static(token: AuthToken): Promise<boolean> {
		await this.transport.get('/users/me', {
			params: {
				access_token: token,
			},
		});
		this.storage.auth_token = token;
		return true;
	}

	async logout(): Promise<void> {
		let refresh_token: string | undefined;

		if (this.options.mode === `json`) {
			refresh_token = this.storage.auth_refresh_token || undefined;
		}

		await this.transport.post('/auth/logout', {
			refresh_token,
		});

		this.storage.auth_token = null;
		this.storage.auth_expires = null;

		if (this.options.mode === `json`) {
			this.storage.auth_refresh_token = null;
		}
	}
}
