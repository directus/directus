import type { Knex } from 'knex';

export const getProjectId = async (db: Knex): Promise<string> => {
	const projectId = await db.select('project_id').from('directus_settings').first();
	return projectId?.project_id || null;
};
