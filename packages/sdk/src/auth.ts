import { PasswordsHandler } from '@/src/handlers/passwords.js';

export type AuthCredentials = {
	email: string;
	password: string;
	otp?: string;
};

export type AuthToken = string;

export type AuthResult = {
	access_token: string;
	expires: number;
	refresh_token?: string | null;
};

export type AuthLoginOptions = {
	refresh?: AuthRefreshOptions;
};

export type AuthRefreshOptions = {
	auto?: boolean;
	time?: number;
};

export interface IAuth {
	readonly token: string | null;
	readonly password: PasswordsHandler;
	readonly expiring: boolean;

	login(credentials: AuthCredentials, options?: AuthLoginOptions): Promise<AuthResult>;
	refresh(force?: boolean): Promise<AuthResult | false>;
	static(token: AuthToken): Promise<boolean>;
	logout(): Promise<void>;
}
