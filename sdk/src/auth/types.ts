export interface AuthenticationConfig {
	mode: 'json' | 'cookie';
	storage?: {
		get: (name: string) => string | undefined;
		set: (name: string, value: string) => void;
	};
}

export interface AuthenticationClient<_Schema extends object> {
	login(creds: { email: string; password: string }): Promise<unknown>;
	refresh(): Promise<unknown>;
	logout(): Promise<unknown>;
}
