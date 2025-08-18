import { ForbiddenError } from '@directus/errors';
import type { AbstractServiceOptions } from '@directus/types';
import {
	AccessService,
	ActivityService,
	CommentsService,
	DashboardsService,
	FilesService,
	FlowsService,
	FoldersService,
	ItemsService,
	NotificationsService,
	OperationsService,
	PanelsService,
	PermissionsService,
	PoliciesService,
	PresetsService,
	RevisionsService,
	RolesService,
	SettingsService,
	SharesService,
	TranslationsService,
	UsersService,
	VersionsService,
	WebhooksService,
} from '../services/index.js';

/**
 * Select the correct service for the given collection. This allows the individual services to run
 * their custom checks (f.e. it allows `UsersService` to prevent updating TFA secret from outside).
 */
export function getService(collection: string, opts: AbstractServiceOptions): ItemsService {
	switch (collection) {
		case 'directus_access':
			return new AccessService(opts);
		case 'directus_activity':
			return new ActivityService(opts);
		case 'directus_comments':
			return new CommentsService(opts);
		case 'directus_dashboards':
			return new DashboardsService(opts);
		case 'directus_files':
			return new FilesService(opts);
		case 'directus_flows':
			return new FlowsService(opts);
		case 'directus_folders':
			return new FoldersService(opts);
		case 'directus_notifications':
			return new NotificationsService(opts);
		case 'directus_operations':
			return new OperationsService(opts);
		case 'directus_panels':
			return new PanelsService(opts);
		case 'directus_permissions':
			return new PermissionsService(opts);
		case 'directus_presets':
			return new PresetsService(opts);
		case 'directus_policies':
			return new PoliciesService(opts);
		case 'directus_revisions':
			return new RevisionsService(opts);
		case 'directus_roles':
			return new RolesService(opts);
		case 'directus_settings':
			return new SettingsService(opts);
		case 'directus_shares':
			return new SharesService(opts);
		case 'directus_translations':
			return new TranslationsService(opts);
		case 'directus_users':
			return new UsersService(opts);
		case 'directus_versions':
			return new VersionsService(opts);
		case 'directus_webhooks':
			return new WebhooksService(opts);
		default:
			// Deny usage of other system collections via ItemsService
			if (collection.startsWith('directus_')) throw new ForbiddenError();

			return new ItemsService(collection, opts);
	}
}
