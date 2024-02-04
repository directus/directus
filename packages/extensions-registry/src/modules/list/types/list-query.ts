import type { ExtensionType } from '@directus/extensions';

export interface ListQuery {
	type?: ExtensionType;
	search?: string;
	limit?: number;
	offset?: number;
	by?: string;
}
