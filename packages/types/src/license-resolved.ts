export type LicenseResolvedKey = 'collections' | 'flows' | 'seats' | 'sso_users';

export type LicenseResolvedEntry = { id: string; resolved_at: string };

export type LicenseResolvedItems = Partial<Record<LicenseResolvedKey, LicenseResolvedEntry[]>>;

export type LicenseResolvedUser = {
	id: string;
	first_name: string | null;
	last_name: string | null;
	avatar: string | null;
	email: string | null;
	admin?: boolean;
};

type Resolved<T> = T & { resolved_at: string };

export type LicenseResolvedLimit<T> = { limit: number; usage: number; candidates: Resolved<T>[] };

export type LicenseResolvedOutput = {
	collections?: LicenseResolvedLimit<{ id: string }>;
	flows?: LicenseResolvedLimit<{ id: string; name: string }>;
	seats?: LicenseResolvedLimit<LicenseResolvedUser>;
	/** `limit` and `usage` are the seat entitlement's, since every restored SSO user takes a seat */
	sso_users?: { entitled: boolean; limit: number; usage: number; candidates: Resolved<LicenseResolvedUser>[] };
};

export type LicenseRestoreInput = { [K in LicenseResolvedKey]?: string[] | undefined };
