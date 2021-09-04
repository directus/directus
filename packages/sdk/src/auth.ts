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

export type AuthAutoRefreshOptions = {
	autoRefresh?: boolean;
	autoRefreshLeadTime?: number; // make sure is positive number...
};

export interface IAuth {
	readonly token: string | null;
	readonly password: PasswordsHandler;
	readonly expiringSoon: boolean;

	login(credentials: AuthCredentials, refreshOptions?: AuthAutoRefreshOptions): Promise<AuthResult>;
	refresh(force?: boolean): Promise<AuthResult | false>;
	static(token: AuthToken): Promise<boolean>;
	logout(): Promise<void>;
}
