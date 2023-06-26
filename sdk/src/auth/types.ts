export type AuthenticationMode = 'json' | 'cookie';

export interface AuthenticationData {
	access_token: string | null;
	refresh_token: string | null;
	expires: number | null;
	expires_at: number | null;
}

export interface AuthenticationStorage {
	get: () => Promise<AuthenticationData | null> | AuthenticationData | null;
	set: (value: AuthenticationData | null) => Promise<void> | void;
}

export interface AuthenticationConfig {
	autoRefresh?: boolean;
	msRefreshBeforeExpires?: number;
	storage?: AuthenticationStorage;
}

export interface AuthenticationClient<_Schema extends object> {
	login(email: string, password: string): Promise<unknown>;
	refresh(): Promise<unknown>;
	logout(): Promise<unknown>;

	getToken(): Promise<string | null>;
	setToken(access_token: string | null): void;
}
