import type { LoginOptions } from '../index.js';

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
	autoRefresh: boolean;
	msRefreshBeforeExpires: number;
	credentials?: RequestCredentials;
	storage?: AuthenticationStorage;
}

export interface AuthenticationClient<_Schema extends object> {
	login(email: string, password: string, options?: LoginOptions): Promise<AuthenticationData>;
	refresh(): Promise<AuthenticationData>;
	logout(): Promise<void>;

	getToken(): Promise<string | null>;
	setToken(access_token: string | null): void;
}

export interface StaticTokenClient<_Schema extends object> {
	getToken(): Promise<string | null>;
	setToken(access_token: string | null): void;
}
