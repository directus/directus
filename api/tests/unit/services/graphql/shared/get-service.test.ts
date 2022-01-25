import knex, { Knex } from 'knex';
import { MockClient } from 'knex-mock-client';
import {
	ItemsService,
	ActivityService,
	FilesService,
	FoldersService,
	NotificationsService,
	PermissionsService,
	PresetsService,
	RevisionsService,
	RolesService,
	SettingsService,
	UsersService,
	WebhooksService,
	SharesService,
} from '../../../../../src/services/';
import { getService } from '../../../../../src/services/graphql/shared/get-service';
import { userSchema } from '../../../../__test-utils__/schemas';

jest.mock('../../../../../src/services/', () => {
	return {
		ItemsService: jest.fn().mockReturnThis(),
		ActivityService: jest.fn().mockReturnThis(),
		FilesService: jest.fn().mockReturnThis(),
		FoldersService: jest.fn().mockReturnThis(),
		PermissionsService: jest.fn().mockReturnThis(),
		PresetsService: jest.fn().mockReturnThis(),
		NotificationsService: jest.fn().mockReturnThis(),
		RevisionsService: jest.fn().mockReturnThis(),
		RolesService: jest.fn().mockReturnThis(),
		SettingsService: jest.fn().mockReturnThis(),
		UsersService: jest.fn().mockReturnThis(),
		WebhooksService: jest.fn().mockReturnThis(),
		SharesService: jest.fn().mockReturnThis(),
	};
});

describe('getService', () => {
	const mockKnex: Knex = knex({ client: MockClient });
	const accountability = { admin: true, role: 'admin' };

	const options = { knex: mockKnex, schema: userSchema, accountability };

	it('returns an ItemsService', () => {
		const service = getService(options, 'userCollection');

		expect(service).toBeInstanceOf(ItemsService);
		expect(ItemsService).toHaveBeenCalledTimes(1);
	});
	it('returns an ActivityService', () => {
		const service = getService(options, 'directus_activity');

		expect(service).toBeInstanceOf(ActivityService);
		expect(ActivityService).toHaveBeenCalledTimes(1);
	});
	it('returns a FilesService', () => {
		const service = getService(options, 'directus_files');

		expect(service).toBeInstanceOf(FilesService);
		expect(FilesService).toHaveBeenCalledTimes(1);
	});
	it('returns a FoldersService', () => {
		const service = getService(options, 'directus_folders');

		expect(service).toBeInstanceOf(FoldersService);
		expect(FoldersService).toHaveBeenCalledTimes(1);
	});
	it('returns a PermissionsService', () => {
		const service = getService(options, 'directus_permissions');

		expect(service).toBeInstanceOf(PermissionsService);
		expect(PermissionsService).toHaveBeenCalledTimes(1);
	});
	it('returns a PresetsService', () => {
		const service = getService(options, 'directus_presets');

		expect(service).toBeInstanceOf(PresetsService);
		expect(PresetsService).toHaveBeenCalledTimes(1);
	});
	it('returns a NotificationsService', () => {
		const service = getService(options, 'directus_notifications');

		expect(service).toBeInstanceOf(NotificationsService);
		expect(NotificationsService).toHaveBeenCalledTimes(1);
	});
	it('returns a RevisionsService', () => {
		const service = getService(options, 'directus_revisions');

		expect(service).toBeInstanceOf(RevisionsService);
		expect(RevisionsService).toHaveBeenCalledTimes(1);
	});
	it('returns a RolesService', () => {
		const service = getService(options, 'directus_roles');

		expect(service).toBeInstanceOf(RolesService);
		expect(RolesService).toHaveBeenCalledTimes(1);
	});
	it('returns a SettingsService', () => {
		const service = getService(options, 'directus_settings');

		expect(service).toBeInstanceOf(SettingsService);
		expect(SettingsService).toHaveBeenCalledTimes(1);
	});
	it('returns a UsersService', () => {
		const service = getService(options, 'directus_users');

		expect(service).toBeInstanceOf(UsersService);
		expect(UsersService).toHaveBeenCalledTimes(1);
	});
	it('returns a WebhooksService', () => {
		const service = getService(options, 'directus_webhooks');

		expect(service).toBeInstanceOf(WebhooksService);
		expect(WebhooksService).toHaveBeenCalledTimes(1);
	});
	it('returns a SharesService', () => {
		const service = getService(options, 'directus_shares');

		expect(service).toBeInstanceOf(SharesService);
		expect(SharesService).toHaveBeenCalledTimes(1);
	});
});
