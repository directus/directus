import type { Permission } from '@directus/types';

export const DEFUAULT_PERMISSION = {
	policy: null,
	permissions: null,
	validation: null,
	presets: null,
	fields: null,
} satisfies Partial<Permission>;
