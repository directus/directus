import { AuthCredentials, AuthLoginOptions, AuthRefreshOptions, AuthResult, AuthToken, IAuth } from '../auth';
import { InvalidRefreshTime, NotAuthenticated } from '../errors';
import { PasswordsHandler } from '../handlers/passwords';
import { IStorage } from '../storage';
import { ITransport } from '../transport';

export type AuthOptions = {
	mode?: 'json' | 'cookie';
};

export class Auth implements IAuth {
	public readonly options: AuthOptions;
	private transport: ITransport;
	private storage: IStorage;
	private refreshTimeout: ReturnType<typeof setTimeout> | false;
	private passwords?: PasswordsHandler;

	constructor(transport: ITransport, storage: IStorage, options?: AuthOptions) {
		this.options = options || {};
		this.options.mode = options?.mode || (typeof window !== 'undefined' ? 'cookie' : 'json');
		this.transport = transport;
		this.storage = storage;
		this.refreshTimeout = false;
	}

	get token(): string | null {
		return this.storage.auth_token;
	}

	get password(): PasswordsHandler {
		return (this.passwords = this.passwords || new PasswordsHandler(this.transport));
	}

	private async refreshToken(): Promise<AuthResult> {
		if (this.storage.auth_token === null) {
			throw new NotAuthenticated();
		}

		const response = await this.transport.post<AuthResult>('/auth/refresh', {
			refresh_token: this.options.mode === 'json' ? this.storage.auth_refresh_token : undefined,
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

	private configureAutoRefresh(result: AuthResult, options?: Partial<AuthRefreshOptions>) {
		const expiration = result?.expires || 0;

		options = options || { auto: false };
		options.auto = typeof options.auto === 'undefined' ? false : options.auto;
		options.time = Math.max(Math.round(typeof options.time === 'undefined' ? expiration * 0.1 : options.time), 0);

		clearTimeout(this.refreshTimeout as ReturnType<typeof setTimeout>);

		if (options.auto) {
			if (options.time <= 0 || expiration - options.time <= 0) {
				throw new InvalidRefreshTime();
			}
			this.refreshTimeout = setTimeout(() => this.refresh(options), expiration - options.time);
		}
	}

	async refresh(options?: Partial<AuthRefreshOptions>): Promise<AuthResult> {
		const result = await this.refreshToken();
		this.configureAutoRefresh(result, options);
		return result;
	}

	async login(credentials: AuthCredentials, options?: Partial<AuthLoginOptions>): Promise<AuthResult> {
		options = options || {};
		const response = await this.transport.post<AuthResult>('/auth/login', {
			mode: this.options.mode,
			...credentials,
		});

		this.configureAutoRefresh(response.data!, options.refresh);

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

		clearTimeout(this.refreshTimeout as ReturnType<typeof setTimeout>);
	}
}
