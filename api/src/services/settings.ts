import { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '../types';
import { isEmpty, omitBy } from 'lodash';
import { ItemsService } from './items';

export class SettingsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
	}

	async upsertSingleton(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		// If theme_overrides is passed, we only want to write the themes passed
		if (data.theme_overrides !== undefined) {
			let combinedOverrides = {};

			/**
			 * We only want to overwrite a theme's overrides if it's explicitly passed.
			 * For instance, if only the dark theme is passed, we don't want to touch
			 * the light theme.
			 *
			 * Here we'll get the current overrides. Afterward, we'll combine them with the
			 * overrides from the request body to build the full patch.
			 */
			const record = await this.readSingleton({ fields: ['theme_overrides'] });

			const currentOverrides = record.theme_overrides || {};

			/**
			 * We'll allow deleting theme overrides by passing an empty object.
			 * We'll omit any empty objects before returning the column value.
			 */
			combinedOverrides = omitBy({ ...currentOverrides, ...data.theme_overrides }, isEmpty);

			data.theme_overrides = combinedOverrides;
		}

		// Now just call the original function
		return await super.upsertSingleton(data, opts);
	}
}
