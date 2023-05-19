import { IAuth, AuthCredentials, AuthResult, AuthToken, AuthOptions, AuthTokenType } from '../auth';
import { PasswordsHandler } from '../handlers/passwords';
import { IStorage } from '../storage';
import { ITransport } from '../transport';

export type AuthStorage<T extends AuthTokenType = 'DynamicToken'> = {
	access_token: T extends 'DynamicToken' | 'StaticToken' ? string : null;
	expires: T extends 'DynamicToken' ? number : null;
	refresh_token?: T extends 'DynamicToken' ? string : null;
};

export class Auth extends IAuth {
	autoRefresh = true;
	msRefreshBeforeExpires = 30000;
	staticToken = '';

	private _storage: IStorage;
	private _transport: ITransport;
	private passwords?: PasswordsHandler;

	private _refreshPromise?: Promise<AuthResult | false>;

	constructor(options: AuthOptions) {
		super();

		this._transport = options.transport;
		this._storage = options.storage;

		this.autoRefresh = options?.autoRefresh ?? this.autoRefresh;
		this.mode = options?.mode ?? this.mode;
		this.msRefreshBeforeExpires = options?.msRefreshBeforeExpires ?? this.msRefreshBeforeExpires;

		if (options?.staticToken) {
			this.staticToken = options?.staticToken;

			this.updateStorage<'StaticToken'>({
				access_token: this.staticToken,
				expires: null,
				refresh_token: null,
			});
		}
	}

	get storage(): IStorage {
		return this._storage;
	}

	get transport(): ITransport {
		return this._transport;
	}

	get token(): Promise<string | null> {
		return (async () => {
			if (this._refreshPromise) {
				try {
					await this._refreshPromise;
				} finally {
					this._refreshPromise = undefined;
				}
			}

			return this._storage.auth_token;
		})();
	}

	get password(): PasswordsHandler {
		return (this.passwords = this.passwords || new PasswordsHandler(this._transport));
	}

	private resetStorage() {
		this._storage.auth_token = null;
		this._storage.auth_refresh_token = null;
		this._storage.auth_expires = null;
		this._storage.auth_expires_at = null;
	}

	private updateStorage<T extends AuthTokenType>(result: AuthStorage<T>) {
		const expires = result.expires ?? null;
		this._storage.auth_token = result.access_token;
		this._storage.auth_refresh_token = result.refresh_token ?? null;
		this._storage.auth_expires = expires;
		this._storage.auth_expires_at = new Date().getTime() + (expires ?? 0);
	}

	async refreshIfExpired() {
		if (this.staticToken) return;
		if (!this.autoRefresh) return;

		if (!this._storage.auth_expires_at) {
			// wait because resetStorage() call in refresh()
			try {
				await this._refreshPromise;
			} finally {
				this._refreshPromise = undefined;
			}

			return;
		}

		if (this._storage.auth_expires_at < new Date().getTime() + this.msRefreshBeforeExpires) {
			this.refresh();
		}

		try {
			await this._refreshPromise; // wait for refresh
		} finally {
			this._refreshPromise = undefined;
		}
	}

	refresh(): Promise<AuthResult | false> {
		const refreshPromise = async () => {
			const refresh_token = this._storage.auth_refresh_token;

			this.resetStorage();

			const response = await this._transport.post<AuthResult>('/auth/refresh', {
				refresh_token: this.mode === 'json' ? refresh_token : undefined,
			});

			this.updateStorage<'DynamicToken'>(response.data!);

			return {
				access_token: response.data!.access_token,
				...(response.data?.refresh_token && { refresh_token: response.data.refresh_token }),
				expires: response.data!.expires,
			};
		};

		return (this._refreshPromise = refreshPromise());
	}

	async login(credentials: AuthCredentials): Promise<AuthResult> {
		this.resetStorage();

		const response = await this._transport.post<AuthResult>(
			'/auth/login',
			{ mode: this.mode, ...credentials },
			{ headers: { Authorization: null } }
		);

		this.updateStorage(response.data!);

		return {
			access_token: response.data!.access_token,
			...(response.data?.refresh_token && {
				refresh_token: response.data.refresh_token,
			}),
			expires: response.data!.expires,
		};
	}

	async static(token: AuthToken): Promise<boolean> {
		if (!this.staticToken) this.staticToken = token;

		await this._transport.get('/users/me', {
			params: { access_token: token },
			headers: { Authorization: null },
		});

		this.updateStorage<'StaticToken'>({
			access_token: token,
			expires: null,
			refresh_token: null,
		});

		return true;
	}

	async logout(): Promise<void> {
		let refresh_token: string | undefined;

		if (this.mode === 'json') {
			refresh_token = this._storage.auth_refresh_token || undefined;
		}

		await this._transport.post('/auth/logout', { refresh_token });

		this.updateStorage<null>({
			access_token: null,
			expires: null,
			refresh_token: null,
		});
	}
}
