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

export interface IAuth {
	readonly token: string | null;
	login(credentials: AuthCredentials): Promise<AuthResult>;
	static(token: AuthToken): Promise<boolean>;
	logout(): Promise<void>;
}
