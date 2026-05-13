import type { LicenseAddon, License as Token } from '@directus/license';
import Type, { type Static } from 'typebox';

export const LicenseAuthHeaders = Type.Object(
	{
		'directus-license-key': Type.String({ minLength: 1 }),
		'directus-project-id': Type.String({ minLength: 1 }),
		'directus-public-url': Type.String({ minLength: 1 }),
	},
	{
		additionalProperties: true,
	},
);

export type LicenseAuthHeadersType = Static<typeof LicenseAuthHeaders>;

export type MockLicense = {
	name: string;
	key: string;
	entitlements: Token['entitlements'];
	meta: Token['meta'];
	max_projects: number;
	projects: { id: string; url: string }[];
	/** Available Addons */
	addons: (LicenseAddon & { unit: 'seats' | 'collections' | 'flows' })[];
};
