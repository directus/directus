import { Auth } from '../../src/base/auth';
import { ItemsHandler } from '../../src/base/items';
import { Transport } from '../../src/base/transport';
import { Directus } from '../../src/base';
import {
	ActivityHandler,
	CollectionsHandler,
	CommentsHandler,
	FieldsHandler,
	FilesHandler,
	FoldersHandler,
	PermissionsHandler,
	PresetsHandler,
	RelationsHandler,
	RevisionsHandler,
	RolesHandler,
	ServerHandler,
	SettingsHandler,
	UsersHandler,
	UtilsHandler,
} from '../../src/handlers';
import { mockServer, URL } from '../utils';
import { InvitesHandler } from '../../src/handlers/invites';
import { TFAHandler } from '../../src/handlers/tfa';
import { MeHandler } from '../../src/handlers/me';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('sdk', function () {
	const sdk = new Directus(URL);

	it('has auth', function () {
		expect(sdk.auth).toBeInstanceOf(Auth);
	});

	it('has transport', function () {
		expect(sdk.transport).toBeInstanceOf(Transport);
	});

	it('has activity instance', function () {
		expect(sdk.activity).toBeInstanceOf(ActivityHandler);
	});

	it('has activity instance', function () {
		expect(sdk.activity.comments).toBeInstanceOf(CommentsHandler);
	});

	it('has collections instance', function () {
		expect(sdk.collections).toBeInstanceOf(CollectionsHandler);
	});

	it('has fields instance', function () {
		expect(sdk.fields).toBeInstanceOf(FieldsHandler);
	});

	it('has files instance', function () {
		expect(sdk.files).toBeInstanceOf(FilesHandler);
	});

	it('has folders instance', function () {
		expect(sdk.folders).toBeInstanceOf(FoldersHandler);
	});

	it('has permissions instance', function () {
		expect(sdk.permissions).toBeInstanceOf(PermissionsHandler);
	});

	it('has presets instance', function () {
		expect(sdk.presets).toBeInstanceOf(PresetsHandler);
	});

	it('has relations instance', function () {
		expect(sdk.relations).toBeInstanceOf(RelationsHandler);
	});

	it('has revisions instance', function () {
		expect(sdk.revisions).toBeInstanceOf(RevisionsHandler);
	});

	it('has roles instance', function () {
		expect(sdk.roles).toBeInstanceOf(RolesHandler);
	});

	it('has server instance', function () {
		expect(sdk.server).toBeInstanceOf(ServerHandler);
	});

	it('has settings instance', function () {
		expect(sdk.settings).toBeInstanceOf(SettingsHandler);
	});

	it('has users instance', function () {
		expect(sdk.users).toBeInstanceOf(UsersHandler);
	});

	it('has users invites', function () {
		expect(sdk.users.invites).toBeInstanceOf(InvitesHandler);
	});

	it('has user profile', function () {
		expect(sdk.users.me).toBeInstanceOf(MeHandler);
	});

	it('has users tfa', function () {
		expect(sdk.users.me.tfa).toBeInstanceOf(TFAHandler);
	});

	it('has utils instance', function () {
		expect(sdk.utils).toBeInstanceOf(UtilsHandler);
	});

	it('has items', async function () {
		expect(sdk.items('collection')).toBeInstanceOf(ItemsHandler);
	});

	it('can run graphql', async () => {
		mockServer.use(
			rest.post(URL + '/graphql', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							posts: [
								{ id: 1, title: 'My first post' },
								{ id: 2, title: 'My second post' },
							],
						},
					})
				)
			)
		);

		const query = `
			query {
				posts {
					id
					title
				}
			}
		`;

		const sdk = new Directus(URL);

		const response = await sdk.graphql.items(query);

		expect(response.data).toMatchObject({
			posts: [
				{ id: 1, title: 'My first post' },
				{ id: 2, title: 'My second post' },
			],
		});

		// expect(scope.pendingMocks().length).toBe(0);
	});

	it('can run graphql on system', async () => {
		mockServer.use(
			rest.post(URL + '/graphql/system', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							users: [{ email: 'someone@example.com' }, { email: 'someone.else@example.com' }],
						},
					})
				)
			)
		);

		const query = `
			query {
				users {
					email
				}
			}
		`;

		const sdk = new Directus(URL);

		const response = await sdk.graphql.system(query);

		expect(response.data).toMatchObject({
			users: [{ email: 'someone@example.com' }, { email: 'someone.else@example.com' }],
		});

		// expect(scope.pendingMocks().length).toBe(0);
	});
});
