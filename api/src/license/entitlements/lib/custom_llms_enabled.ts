import type { Knex } from 'knex';
import { CUSTOM_LLM_FIELDS } from '../../../constants.js';
import { SettingsService } from '../../../services/index.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function checkCustomLLM(opts?: { knex?: Knex | undefined }) {
	const settingsService = new SettingsService({
		schema: await getSchema(),
		knex: opts?.knex,
	});

	const data = await settingsService.readSingleton({
		fields: [...CUSTOM_LLM_FIELDS],
	});

	return Boolean(CUSTOM_LLM_FIELDS.find((key) => data[key] !== null));
}
