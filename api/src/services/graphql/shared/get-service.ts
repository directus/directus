import {
	ActivityService,
	FilesService,
	FoldersService,
	ItemsService,
	NotificationsService,
	PermissionsService,
	PresetsService,
	RevisionsService,
	RolesService,
	SettingsService,
	SharesService,
	UsersService,
	WebhooksService,
} from '../..';
import { AbstractServiceOptions } from '../../../types';

/**
 * Select the correct service for the given collection. This allows the individual services to run
 * their custom checks (f.e. it allows UsersService to prevent updating TFA secret from outside)
 */
export const getService = (options: AbstractServiceOptions, collection: string): ItemsService => {
	const opts = {
		knex: options.knex,
		accountability: options.accountability,
		schema: options.schema,
	};

	switch (collection) {
		case 'directus_activity':
			return new ActivityService(opts);
		case 'directus_files':
			return new FilesService(opts);
		case 'directus_folders':
			return new FoldersService(opts);
		case 'directus_permissions':
			return new PermissionsService(opts);
		case 'directus_presets':
			return new PresetsService(opts);
		case 'directus_notifications':
			return new NotificationsService(opts);
		case 'directus_revisions':
			return new RevisionsService(opts);
		case 'directus_roles':
			return new RolesService(opts);
		case 'directus_settings':
			return new SettingsService(opts);
		case 'directus_users':
			return new UsersService(opts);
		case 'directus_webhooks':
			return new WebhooksService(opts);
		case 'directus_shares':
			return new SharesService(opts);
		default:
			return new ItemsService(collection, opts);
	}
};
