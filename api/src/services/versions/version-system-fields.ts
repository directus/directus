// TODO: Rename to directus prefix once shadow tables are supported
export const VERSION_SYSTEM_FIELDS = {
	primary: {
		field: 'shadow_id',
		type: 'integer',
		meta: {
			hidden: true,
			interface: 'numeric',
			readonly: true,
		},
		schema: {
			is_primary_key: true,
			has_auto_increment: true,
		},
	},
	version: {
		field: 'shadow_version',
		type: 'string',
		meta: {
			interface: 'input',
		},
		schema: {
			// TODO: Indexed?
		},
	},
};
