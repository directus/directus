import type { Knex } from 'knex';

/**
 * Given a starting role ID, fetches the entire hierarchy of roles up to the root.
 *
 * @param start - The starting role ID.
 * @param context
 * @returns An array of role IDs from root to the starting role.
 */
export async function fetchRolesTree(start: string | null, context: { knex: Knex }): Promise<string[]> {
	if (!start) return [];

	let parent: string | null = start;
	const roles: string[] = [];
	const { knex } = context;

	while (parent) {
		const role: { id: string; parent: string | null } | undefined = await knex
			.select('id', 'parent')
			.from('directus_roles')
			.where({ id: parent })
			.first();

		if (!role) {
			break;
		}

		roles.push(role.id);

		// Prevent infinite recursion loops
		if (role.parent && roles.includes(role.parent) === true) {
			roles.reverse();
			const rolesStr = roles.map((role) => `"${role}"`).join('->');
			throw new Error(`Recursion encountered: role "${role.id}" already exists in tree path ${rolesStr}`);
		}

		parent = role.parent;
	}

	roles.reverse();

	return roles;
}
