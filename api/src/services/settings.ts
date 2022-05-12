import { Query } from '@directus/shared/types';
import { AbstractServiceOptions, Item, MutationOptions, PrimaryKey } from '../types';
import { isEmpty, omitBy } from 'lodash';
import { InvalidPayloadException } from '../exceptions';
import { isValidThemeJson } from '../utils/validate-theme-json';
import { ItemsService } from './items';

export class SettingsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_settings', options);
	}

	async updateThemeOverrides(data: Partial<Item>, query: Query) {
		const error = isValidThemeJson(data);
		if (error !== undefined) {
			throw new InvalidPayloadException(error.message);
		}

		let combinedOverrides = {};

		/**
		 * We only want to overwrite a theme's overrides if it's explicitly passed.
		 * For instance, if only the dark theme is passed, we don't want to touch
		 * the light theme.
		 *
		 * Here we'll get the current overrides. Afterward, we'll combine them with the
		 * overrides from the request body to build the full patch.
		 */
		const record = await this.readSingleton(query);
		const currentOverrides = record.theme_overrides || {};

		/**
		 * We'll allow deleting theme overrides by passing an empty object.
		 * We'll omit any empty objects before returning the column value.
		 */
		combinedOverrides = omitBy({ ...currentOverrides, ...data }, isEmpty);

		/**
		 * The /themes endpoint only accepts the theme list, we need to modify
		 * the query to target the theme_overrides column
		 */
		const column = { theme_overrides: combinedOverrides };

		return await super.upsertSingleton(column);
	}

	async upsertSingleton(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		/**
		 * We want to have more modular control over how themes are saved
		 * so we'll enforce usage of the /themes endpoint instead of directly
		 * altering theme_overrides
		 */
		if (data.theme_overrides !== undefined) {
			throw new InvalidPayloadException(
				'Themes should be updated from the /settings/themes endpoint (REST), or utilizing the update_theme_overrides mutation (GraphQL).'
			);
		}

		// We passed that check, we can just call the original function
		return await super.upsertSingleton(data, opts);
	}
}
