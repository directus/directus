import { AuthAutoRefreshOptions, AuthCredentials, AuthResult, AuthToken, IAuth } from '../auth';
import { PasswordsHandler } from '../handlers/passwords';
import { IStorage } from '../storage';
import { ITransport } from '../transport';
import { Debouncer } from '../utils';

export type AuthOptions = {
	authTransport?: ITransport;
	authStorage?: IStorage;
	mode?: 'json' | 'cookie';
	refreshOptions?: AuthAutoRefreshOptions;
};

export type AuthInternalOptions = Omit<AuthOptions, 'authTransport' | 'authStorage'>;

const DefaultLeadTime = 30000;

export class Auth implements IAuth {
	public readonly options: AuthInternalOptions;

	private transport: ITransport;
	private storage: IStorage;
	private timer: ReturnType<typeof setTimeout> | false;
	private passwords?: PasswordsHandler;
	private refresher: Debouncer<AuthResult | false>;

	constructor(transport: ITransport, storage: IStorage, options?: AuthInternalOptions) {
		this.options = options || {};
		this.options.mode = options?.mode || (typeof window !== 'undefined' ? 'cookie' : 'json');
		this.options.refreshOptions = options?.refreshOptions || {
			autoRefresh: true,
			autoRefreshLeadTime: DefaultLeadTime,
		};
		this.options.refreshOptions.autoRefresh = options?.refreshOptions?.autoRefresh ?? true;
		this.options.refreshOptions.autoRefreshLeadTime = options?.refreshOptions?.autoRefreshLeadTime ?? DefaultLeadTime;
		this.transport = transport;
		this.storage = storage;
		this.timer = false;
		this.refresher = new Debouncer(this.refreshToken.bind(this));
		try {
			this.updateRefresh(this.options?.refreshOptions);
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

	get expiringSoon(): boolean {
		const expiresAt = this.storage.auth_expires_at;
		if (expiresAt === null) {
			return false;
		}

		const refreshDeadline = expiresAt - (this.options.refreshOptions?.autoRefreshLeadTime ?? 0);
		return refreshDeadline <= Date.now();
	}

	private async refreshToken(force = false): Promise<AuthResult | false> {
		if (!force && !this.expiringSoon) {
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
			this.storage.auth_expires_at = Date.now() + result.expires;
		} else {
			this.storage.auth_expires_at = null;
		}
	}

	private updateRefresh(options?: Partial<AuthAutoRefreshOptions>) {
		const expiresAt = this.storage.auth_expires_at;
		if (expiresAt === null) {
			clearTimeout(this.timer as ReturnType<typeof setTimeout>);
			return; // Don't auto refresh if there's no expiration time (token auth)
		}

		if (options) {
			this.options.refreshOptions!.autoRefresh = options.autoRefresh ?? this.options.refreshOptions!.autoRefresh;
			this.options.refreshOptions!.autoRefreshLeadTime =
				options.autoRefreshLeadTime ?? this.options.refreshOptions!.autoRefreshLeadTime;
		}

		clearTimeout(this.timer as ReturnType<typeof setTimeout>);

		let remaining = expiresAt - this.options.refreshOptions!.autoRefreshLeadTime! - Date.now();
		if (remaining < 0) {
			// It's already expired, try a refresh
			if (expiresAt < Date.now()) {
				// should be impossible?
				return; // Don't set auto refresh
			} else {
				remaining = 0;
			}
		}

		if (this.options.refreshOptions!.autoRefresh) {
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

	async login(credentials: AuthCredentials, refreshOptions?: Partial<AuthAutoRefreshOptions>): Promise<AuthResult> {
		// why does login take its own refresh options object?
		refreshOptions = refreshOptions || {};
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
		this.updateRefresh(refreshOptions);

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
		this.storage.auth_expires_at = null;
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
		this.storage.auth_expires_at = null;
		this.storage.auth_refresh_token = null;

		clearTimeout(this.timer as ReturnType<typeof setTimeout>);
	}
}
