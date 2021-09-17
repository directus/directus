import { AuthAutoRefreshOptions, AuthCredentials, AuthResult, AuthToken, IAuth } from '../auth';
import { PasswordsHandler } from '../handlers/passwords';
import { IStorage } from '../storage';
import { ITransport } from '../transport';
import { Debouncer } from '../utils';

export type AuthOptions = {
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
		// Setting options
		this.options = options || {};
		this.options.mode = options?.mode || (typeof window !== 'undefined' ? 'cookie' : 'json');
		// TODO: prevent cookie mode in node
		this.options.refreshOptions = options?.refreshOptions || {
			autoRefresh: true,
			autoRefreshLeadTime: DefaultLeadTime,
		};
		this.options.refreshOptions.autoRefresh = options?.refreshOptions?.autoRefresh ?? true;
		this.options.refreshOptions.autoRefreshLeadTime = options?.refreshOptions?.autoRefreshLeadTime ?? DefaultLeadTime;

		if (this.options.refreshOptions.autoRefreshLeadTime < 0) {
			throw new Error("Option 'autoRefreshLeadTime' cannot be a negative number"); // Is this the proper way to handle config errors?
		}
		this.transport = transport;
		this.storage = storage;
		this.timer = false;
		this.refresher = new Debouncer(this.refreshToken.bind(this));
		try {
			this.updateRefresher(this.options?.refreshOptions);
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

		const response = await this.transport.post<AuthResult>('/auth/refresh', {
			refresh_token: this.options.mode === 'json' ? this.storage.auth_refresh_token : undefined,
		});

		this.updateStorage(response.data!);
		this.updateRefresher();

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
			// should technically be the response time of the request, not Date.now()
			this.storage.auth_expires_at = Date.now() + result.expires;
		} else {
			this.storage.auth_expires_at = null;
		}
	}

	private updateRefresher(options?: Partial<AuthAutoRefreshOptions>) {
		// Reset timer
		clearTimeout(this.timer as ReturnType<typeof setTimeout>);

		const expiresAt = this.storage.auth_expires_at;
		if (expiresAt === null) {
			return; // Don't set timer if there's no expiration time (token auth)
		}

		// Update options
		if (options) {
			this.options.refreshOptions!.autoRefresh = options.autoRefresh ?? this.options.refreshOptions!.autoRefresh;
			this.options.refreshOptions!.autoRefreshLeadTime =
				options.autoRefreshLeadTime ?? this.options.refreshOptions!.autoRefreshLeadTime;
		}

		let remaining = expiresAt - this.options.refreshOptions!.autoRefreshLeadTime! - Date.now();
		// TODO: how to deal with the unlikely edge case that LeadTime > token TTL; creates infinite refresh loop (why doesn't debouncer catch this?)
		if (remaining < 0) {
			// It's already expired, try a refresh
			if (expiresAt < Date.now()) {
				// Is already expired
				return;
			} else {
				// Is not expired, but will be soon
				remaining = 0;
			}
		}

		if (this.options.refreshOptions!.autoRefresh) {
			this.timer = setTimeout(() => {
				this.refresh();
			}, remaining);
		}
	}

	async refresh(force = false): Promise<AuthResult | false> {
		return await this.refresher.debounce(force);
	}

	async login(credentials: AuthCredentials, refreshOptions?: Partial<AuthAutoRefreshOptions>): Promise<AuthResult> {
		// why does login take its own refresh options object so you can change the global login options on repeat logins?
		refreshOptions = refreshOptions || {};

		// Shouldn't be sending any credentials on login
		this.storage.auth_token = null;
		this.storage.auth_expires_at = null;

		const response = await this.transport.post<AuthResult>('/auth/login', {
			mode: this.options.mode,
			...credentials,
		});

		this.updateStorage(response.data!);
		this.updateRefresher(refreshOptions);

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

		await this.transport.post('/auth/logout', {
			refresh_token,
		});

		this.storage.auth_token = null;
		this.storage.auth_expires_at = null;
		this.storage.auth_refresh_token = null;

		clearTimeout(this.timer as ReturnType<typeof setTimeout>);
	}
}
