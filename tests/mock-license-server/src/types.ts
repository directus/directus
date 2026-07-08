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

export type MockLicense = MockDirectusLicense | MockMonospaceLicense;

export type MockDirectusLicense = {
	name: string;
	key: string;
	entitlements: Token['entitlements'];
	meta: Token['meta'];
	max_projects: number;
	projects: { id: string; url: string }[];
	/** Available Addons */
	addons: (LicenseAddon & { unit: 'seats' | 'collections' | 'flows' })[];
};

export type MockMonospaceLicense = {
	name: string;
	key: string;
	entitlements: MonospaceEntitlements;
	meta: MonospaceMeta;
	issued_at: number;
	max_projects: number;
	projects: { id: string; url: string }[];
};

export type MonospaceMeta = {
	name: string;
	version: string;
	offline: boolean;
	expires_at?: number | undefined;
	renews_at?: number | undefined;
	grace_period: number;
	validation_interval: number;
};

export type MonospaceEntitlements = {
	workspaces: NumericEntitlement;
	seats: NumericEntitlement;
	custom_roles: NumericEntitlement;
	sso_enabled: BooleanEntitlement;
	custom_permission_rules_enabled: BooleanEntitlement;
	offline_enabled: BooleanEntitlement;
	telemetry_required: BooleanEntitlement;
	production_enabled: BooleanEntitlement;
	audit_logs_enabled: BooleanEntitlement;
	service_accounts_enabled: BooleanEntitlement;
	premium_connectors_enabled: BooleanEntitlement;
	custom_connectors_enabled: BooleanEntitlement;
};

type NumericEntitlement = {
	limit: number;
	overage?: number | undefined;
	addon?: number | undefined;
};

type BooleanEntitlement = {
	default: boolean;
	supersede?: boolean | undefined;
};
