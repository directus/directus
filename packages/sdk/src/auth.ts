import { PasswordsHandler } from './handlers/passwords';

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
	refresh: AuthRefreshOptions;
};

export type AuthRefreshOptions = {
	auto: boolean;
	time?: number;
};

export interface IAuth {
	readonly token: string | null;
	readonly password: PasswordsHandler;

	login(credentials: AuthCredentials, options?: AuthLoginOptions): Promise<AuthResult>;
	refresh(options?: AuthRefreshOptions): Promise<AuthResult>;
	static(token: AuthToken): Promise<boolean>;
	logout(): Promise<void>;
}
