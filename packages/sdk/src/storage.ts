export abstract class IStorage {
	abstract auth_token: string | null;
	abstract auth_expires: number | null;
	abstract auth_expires_at: number | null;
	abstract auth_refresh_token: string | null;

	abstract get(key: string): string | null;
	abstract set(key: string, value: string): string;
	abstract delete(key: string): string | null;
}
