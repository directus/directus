import { Query } from '../types/query';
import * as ItemsService from './items';
import { Accountability } from '../types';
import database, { schemaInspector } from '../database';

export const readSettings = async (query: Query) => {
	const settings = await ItemsService.readItems('directus_settings', {
		...query,
		limit: 1,
	});

	const settingsObj = settings[0];

	if (!settingsObj) {
		const settingsColumns = await schemaInspector.columnInfo('directus_settings');
		const defaults = {};

		for (const column of settingsColumns) {
			defaults[column.name] = column.default_value;
		}

		return defaults;
	}

	return settingsObj;
};

export const updateSettings = async (data: Record<string, any>, accountability: Accountability) => {
	const record = await database.select('id').from('directus_settings').limit(1).first();

	if (record) {
		return await ItemsService.updateItem('directus_settings', record.id, data, accountability);
	}

	return await ItemsService.createItem('directus_settings', data, accountability);
};
