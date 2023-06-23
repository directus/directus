export type AuthTokenMode = 'cookie' | 'json';

export interface AuthenticationConfigJson {
	storage?: {
		get: (name: string) => Promise<string | undefined>;
		set: (name: string, value: string) => Promise<void>;
	};
}

export interface AuthenticationClient<_Schema extends object> {
	login(credentials: AuthenticationCredentials): Promise<void>;
	refresh(): Promise<unknown>;
	logout(): Promise<unknown>;
}

export interface AuthenticationCredentials {
	email: string;
	password: string;
	otp?: number;
}
