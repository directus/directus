import type { Knex } from 'knex';
import { CUSTOM_LLM_FIELDS } from '../../../constants.js';
import getDatabase from '../../../database/index.js';
import { SettingsService } from '../../../services/index.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function checkCustomLLM(opts?: { knex?: Knex | undefined }) {
	const knex = opts?.knex ?? getDatabase();
	const schema = await getSchema({ database: knex });

	const settingsService = new SettingsService({
		schema,
		knex,
	});

	const data = await settingsService.readSingleton({
		fields: [...CUSTOM_LLM_FIELDS],
	});

	return !CUSTOM_LLM_FIELDS.find((key) => data[key] !== null);
}
