import { getDatabase } from '../database/index.js';

export async function getProjectId(): Promise<string | undefined> {
	const database = getDatabase();
	const settingsRow = await database.select('project_id').from('directus_settings').first();
	const projectId = settingsRow?.project_id;

	if (!projectId) return undefined;

	return String(projectId);
}
