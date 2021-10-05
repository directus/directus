import { AuthCredentials, AuthLoginOptions, AuthRefreshOptions, AuthResult, AuthToken, IAuth } from '../auth.js';
import { PasswordsHandler } from '../handlers/passwords.js';
import { IStorage } from '../storage.js';
import { ITransport } from '../transport.js';
import { Debouncer } from '../utils.js';

export type AuthOptions = {
	mode?: 'json' | 'cookie';
	refresh?: AuthRefreshOptions;
};

const DefaultExpirationTime = 30000;

export class Auth implements IAuth {
	public readonly options: AuthOptions;

	private transport: ITransport;
	private storage: IStorage;
	private timer: ReturnType<typeof setTimeout> | false;
	private passwords?: PasswordsHandler;
	private refresher: Debouncer<AuthResult | false>;

	constructor(transport: ITransport, storage: IStorage, options?: AuthOptions) {
		this.options = options || {};
		this.options.mode = options?.mode || (typeof window !== 'undefined' ? 'cookie' : 'json');
		this.options.refresh = options?.refresh || { auto: false, time: DefaultExpirationTime };
		this.options.refresh.auto = this.options.refresh?.auto ?? false;
		this.options.refresh.time = this.options.refresh?.time ?? DefaultExpirationTime;
		this.transport = transport;
		this.storage = storage;
		this.timer = false;
		this.refresher = new Debouncer(this.refreshToken.bind(this));
		try {
			this.updateRefresh(this.options?.refresh);
		} catch {
			// Ignore error
		}
	}

	get token(): string | null {
		return this.storage.auth_token;
	}

	get password(): PasswordsHandler {
		return (this.passwords = this.passwords || new PasswordsHandler(this.transport));
	}

	get expiring(): boolean {
		const expiration = this.storage.auth_expires;
		if (expiration === null) {
			return false;
		}

		const expiringAfter = expiration - (this.options.refresh?.time ?? 0);
		return expiringAfter <= Date.now();
	}

	private async refreshToken(force = false): Promise<AuthResult | false> {
		if (!force && !this.expiring) {
			return false;
		}

		const response = await this.transport.post<AuthResult>(
			'/auth/refresh',
			{
				refresh_token: this.options.mode === 'json' ? this.storage.auth_refresh_token : undefined,
			},
			{
				refreshTokenIfNeeded: false,
			}
		);

		this.updateStorage(response.data!);
		this.updateRefresh();

		return {
			access_token: response.data!.access_token,
			refresh_token: response.data?.refresh_token,
			expires: response.data!.expires,
		};
	}

	private updateStorage(result: AuthResult) {
		this.storage.auth_token = result.access_token;
		this.storage.auth_refresh_token = result.refresh_token ?? null;
		if (result.expires) {
			this.storage.auth_expires = Date.now() + result.expires;
		} else {
			this.storage.auth_expires = null;
		}
	}

	private updateRefresh(options?: Partial<AuthRefreshOptions>) {
		const expiration = this.storage.auth_expires;
		if (expiration === null) {
			clearTimeout(this.timer as ReturnType<typeof setTimeout>);
			return; // Don't auto refresh if there's no expiration time (token auth)
		}

		if (options) {
			this.options.refresh!.auto = options.auto ?? this.options.refresh!.auto;
			this.options.refresh!.time = options.time ?? this.options.refresh!.time;
		}

		clearTimeout(this.timer as ReturnType<typeof setTimeout>);

		let remaining = expiration - this.options.refresh!.time! - Date.now();
		if (remaining < 0) {
			// It's already expired, try a refresh
			if (expiration < Date.now()) {
				return; // Don't set auto refresh
			} else {
				remaining = 0;
			}
		}

		if (this.options.refresh!.auto) {
			this.timer = setTimeout(() => {
				this.refresh()
					.then(() => {
						// Do nothing
					})
					.catch(() => {
						// Do nothing
					});
			}, remaining);
		}
	}

	async refresh(force = false): Promise<AuthResult | false> {
		return await this.refresher.debounce(force);
	}

	async login(credentials: AuthCredentials, options?: Partial<AuthLoginOptions>): Promise<AuthResult> {
		options = options || {};
		const response = await this.transport.post<AuthResult>(
			'/auth/login',
			{
				mode: this.options.mode,
				...credentials,
			},
			{
				refreshTokenIfNeeded: false,
				sendAuthorizationHeaders: false,
			}
		);

		this.updateStorage(response.data!);
		this.updateRefresh(options.refresh);

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
		this.storage.auth_expires = null;
		this.storage.auth_refresh_token = null;
		return true;
	}

	async logout(): Promise<void> {
		let refresh_token: string | undefined;
		if (this.options.mode === 'json') {
			refresh_token = this.storage.auth_refresh_token || undefined;
		}

		await this.transport.post(
			'/auth/logout',
			{
				refresh_token,
			},
			{
				refreshTokenIfNeeded: false,
			}
		);

		this.storage.auth_token = null;
		this.storage.auth_expires = null;
		this.storage.auth_refresh_token = null;

		clearTimeout(this.timer as ReturnType<typeof setTimeout>);
	}
}
