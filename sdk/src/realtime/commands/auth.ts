export interface EmailAuth {
	email: string;
	password: string;
	uid?: string;
}
export interface TokenAuth {
	access_token: string;
	uid?: string;
}
export interface RefreshAuth {
	refresh_token: string;
	uid?: string;
}

export function auth(creds: EmailAuth | TokenAuth | RefreshAuth): string {
	return JSON.stringify({ ...creds, type: 'auth' });
}
