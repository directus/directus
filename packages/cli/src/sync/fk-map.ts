/** A system field that references another synced collection. */
export interface FkField {
	readonly field: string;
	readonly references: string;
}

/**
 * Export-surviving system FKs used by reconciliation and import remapping. Derived from
 * `packages/system-data/src/relations/relations.yaml`; empty entries keep the lookup total.
 */
export const SYSTEM_FK_FIELDS: Readonly<Record<string, readonly FkField[]>> = {
	directus_access: [
		{ field: 'role', references: 'directus_roles' },
		{ field: 'policy', references: 'directus_policies' },
		{ field: 'user', references: 'directus_users' },
	],
	directus_permissions: [{ field: 'policy', references: 'directus_policies' }],
	directus_operations: [
		{ field: 'flow', references: 'directus_flows' },
		{ field: 'resolve', references: 'directus_operations' },
		{ field: 'reject', references: 'directus_operations' },
	],
	directus_panels: [{ field: 'dashboard', references: 'directus_dashboards' }],
	directus_flows: [{ field: 'operation', references: 'directus_operations' }],
	directus_roles: [{ field: 'parent', references: 'directus_roles' }],
	directus_users: [{ field: 'role', references: 'directus_roles' }],
	directus_settings: [{ field: 'public_registration_role', references: 'directus_roles' }],
	directus_dashboards: [],
	directus_policies: [],
	directus_translations: [],
};
