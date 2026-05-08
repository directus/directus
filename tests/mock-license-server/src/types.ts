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
