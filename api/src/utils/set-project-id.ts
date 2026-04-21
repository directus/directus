import type { Knex } from 'knex';
import { getDatabase } from '../database/index.js';

export async function setProjectId(projectId: string, knex?: Knex): Promise<void> {
	const database = knex ?? getDatabase();
	await database('directus_settings').update({ project_id: projectId }).where('id', 1);
}
