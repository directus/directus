// Static FK table for the system collections this branch syncs: for each collection, which of its fields
// hold references to ANOTHER synced system collection. Reconcile consumes it so a natural key made of FK
// components compares in target-ID space; the later import slice consumes it to remap those fields in the
// payload before upsert.
//
// Ground truth is the monorepo's system relations definition,
// packages/system-data/src/relations/relations.yaml — each entry there is `many_collection.many_field ->
// one_collection`. This table is exactly the subset of those whose one_collection is itself in the synced
// set { access, permissions, operations, panels, flows, roles, users, settings, dashboards, policies,
// translations }, so a lookup can only ever name a collection reconcile and import also carry.
//
// Two whole categories of real FK from relations.yaml are DELIBERATELY omitted, because the fields are
// stripped at export by another slice and so never reach a payload to remap:
//   - references to out-of-scope collections: directus_users.avatar and directus_settings.{project_logo,
//     public_foreground, public_background, public_favicon} -> directus_files, and
//     directus_settings.storage_default_folder -> directus_folders.
//   - user_created on directus_flows / directus_operations / directus_dashboards / directus_panels: it
//     references directus_users (in the set) but is stripped because the creating user cannot exist on
//     the target. Listing it would imply a remap that never runs.
// directus_dashboards, directus_policies, and directus_translations have no in-set, export-surviving FK
// field at all (their only relations are user_created or reverse aliases), so they carry empty arrays —
// present so a lookup keyed by any synced collection is total rather than a missing-key hazard.

export interface FkField {
	readonly field: string;
	readonly references: string;
}

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
