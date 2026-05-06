import Type, { type Static } from 'typebox';

export const LicenseAuthHeaders = Type.Object(
	{
		project_id: Type.String({ minLength: 1 }),
		license_key: Type.String({ minLength: 1 }),
		public_url: Type.String({ minLength: 1 }),
	},
	{
		additionalProperties: false,
	},
);

export type LicenseAuthHeadersType = Static<typeof LicenseAuthHeaders>;
