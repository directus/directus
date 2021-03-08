export type AuthCredentials = {
	type: 'credentials';
	email: string;
	password: string;
	otp?: string;
};

export type AuthToken = {
	type: 'token';
	token: string;
};

export type AuthData = AuthCredentials | AuthToken;

export type AuthResult = {
	access_token: string;
	expires: number;
	refresh_token?: string;
};

export interface IAuth {
	authenticate(data: AuthData): Promise<AuthResult>;
}
