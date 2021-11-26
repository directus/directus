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
	private timer: ReturnType<typeof setTimeout> | null;
	private passwords?: PasswordsHandler;

	constructor(options: AuthOptions) {
		super();

		this.timer = null;
		this._transport = options.transport;
		this._storage = options.storage;

		this.autoRefresh = options?.autoRefresh ?? this.autoRefresh;
		this.mode = options?.mode ?? this.mode;
		this.msRefreshBeforeExpires = options?.msRefreshBeforeExpires ?? this.msRefreshBeforeExpires;

		if (options?.staticToken) {
			this.staticToken = options?.staticToken;
			this.updateStorage<'StaticToken'>({ access_token: this.staticToken, expires: null, refresh_token: null });
		} else if (this.autoRefresh) {
			this.autoRefreshJob();
		}
	}

	get storage(): IStorage {
		return this._storage;
	}

	get transport(): ITransport {
		return this._transport;
	}

	get token(): string | null {
		return this._storage.auth_token;
	}

	get password(): PasswordsHandler {
		return (this.passwords = this.passwords || new PasswordsHandler(this._transport));
	}

	private resetStorage() {
		this._storage.auth_token = null;
		this._storage.auth_refresh_token = null;
		this._storage.auth_expires = null;
	}

	private updateStorage<T extends AuthTokenType>(result: AuthStorage<T>) {
		this._storage.auth_token = result.access_token;
		this._storage.auth_refresh_token = result.refresh_token ?? null;
		this._storage.auth_expires = result.expires ?? null;
	}

	private autoRefreshJob() {
		if (!this.autoRefresh) return;
		if (!this._storage.auth_expires) return;

		if (this.timer) clearTimeout(this.timer);

		const msWaitUntilRefresh = this._storage.auth_expires - this.msRefreshBeforeExpires;

		this.timer = setTimeout(async () => {
			await this.refresh().catch(() => {
				/*do nothing*/
			});

			this.autoRefreshJob();
		}, msWaitUntilRefresh);
	}

	async refresh(): Promise<AuthResult | false> {
		const refresh_token = this._storage.auth_refresh_token;
		this.resetStorage();

		const response = await this._transport.post<AuthResult>('/auth/refresh', {
			refresh_token: this.mode === 'json' ? refresh_token : undefined,
		});

		this.updateStorage<'DynamicToken'>(response.data!);

		if (this.autoRefresh) this.autoRefreshJob();

		return {
			access_token: response.data!.access_token,
			refresh_token: response.data?.refresh_token,
			expires: response.data!.expires,
		};
	}

	async login(credentials: AuthCredentials): Promise<AuthResult> {
		this.resetStorage();

		const response = await this._transport.post<AuthResult>(
			'/auth/login',
			{ mode: this.mode, ...credentials },
			{ headers: { Authorization: null } }
		);

		this.updateStorage(response.data!);

		if (this.autoRefresh) this.autoRefreshJob();

		return {
			access_token: response.data!.access_token,
			refresh_token: response.data?.refresh_token,
			expires: response.data!.expires,
		};
	}

	async static(token: AuthToken): Promise<boolean> {
		await this._transport.get('/users/me', { params: { access_token: token }, headers: { Authorization: null } });

		this.updateStorage<'StaticToken'>({ access_token: token, expires: null, refresh_token: null });

		return true;
	}

	async logout(): Promise<void> {
		let refresh_token: string | undefined;
		if (this.mode === 'json') {
			refresh_token = this._storage.auth_refresh_token || undefined;
		}

		await this._transport.post('/auth/logout', { refresh_token });

		this.updateStorage<null>({ access_token: null, expires: null, refresh_token: null });

		clearTimeout(this.timer as ReturnType<typeof setTimeout>);
	}
}
