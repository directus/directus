export interface IStorage {
	auth_token: string | null;
	auth_expires: number | null;
	auth_refresh_token: string | null;

	get(key: string): string | null;
	set(key: string, value: string): string;
	delete(key: string): string | null;
}
