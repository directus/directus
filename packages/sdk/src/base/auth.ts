import { IDirectusBase } from '../directus';
import { AuthCredentials, AuthResult, AuthToken, AuthOptions, AuthResultType, IAuth } from '../auth';
import { PasswordsHandler } from '../handlers/passwords';

export class Auth extends IAuth {
	private sdk: IDirectusBase;
	private timer: ReturnType<typeof setTimeout> | false;
	private passwords?: PasswordsHandler;

	constructor(sdk: IDirectusBase, options?: AuthOptions | undefined) {
		super();

		this.sdk = sdk;

		this.autoRefresh = options?.autoRefresh ?? this.autoRefresh;
		this.mode = options?.mode ?? this.mode;
		this.msRefreshBeforeExpires = options?.msRefreshBeforeExpires ?? this.msRefreshBeforeExpires;

		this.timer = false;
	}

	get token(): string | null {
		return this.sdk.storage.auth_token;
	}

	get password(): PasswordsHandler {
		return (this.passwords = this.passwords || new PasswordsHandler(this.sdk.transport));
	}

	private updateStorage<T extends AuthResultType>(result: AuthResult<T>) {
		this.sdk.storage.auth_token = result.access_token;
		this.sdk.storage.auth_refresh_token = result.refresh_token ?? null;
		this.sdk.storage.auth_expires = result.expires ?? null;
	}

	private autoRefreshJob() {
		if (!this.sdk.storage.auth_expires) return;

		const msWaitUntilRefresh = this.sdk.storage.auth_expires - this.msRefreshBeforeExpires;

		this.timer = setTimeout(async () => {
			await this.refresh().catch(() => {
				/*do nothing*/
			});

			this.autoRefreshJob();
		}, msWaitUntilRefresh);
	}

	async refresh(): Promise<AuthResult | false> {
		const response = await this.sdk.transport.post<AuthResult>('/auth/refresh', {
			refresh_token: this.mode === 'json' ? this.sdk.storage.auth_refresh_token : undefined,
		});

		this.updateStorage<'DynamicToken'>(response.data!);

		return {
			access_token: response.data!.access_token,
			refresh_token: response.data?.refresh_token,
			expires: response.data!.expires,
		};
	}

	async login(credentials: AuthCredentials): Promise<AuthResult> {
		const response = await this.sdk.transport.post<AuthResult>(
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
		await this.sdk.transport.get('/users/me', { params: { access_token: token }, headers: { Authorization: null } });

		this.updateStorage<'StaticToken'>({ access_token: token, expires: null, refresh_token: null });

		return true;
	}

	async logout(): Promise<void> {
		let refresh_token: string | undefined;
		if (this.mode === 'json') {
			refresh_token = this.sdk.storage.auth_refresh_token || undefined;
		}

		await this.sdk.transport.post('/auth/logout', { refresh_token });

		this.updateStorage<null>({ access_token: null, expires: null, refresh_token: null });

		clearTimeout(this.timer as ReturnType<typeof setTimeout>);
	}
}
