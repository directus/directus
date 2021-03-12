/**
 * @jest-environment node
 */

import { Auth } from '../../src/base/auth';
import { ItemsHandler } from '../../src/base/items';
import { AxiosTransport } from '../../src/base/transport/axios-transport';
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
import { test } from '../utils';

describe('node sdk', function () {
	const sdk = new Directus('http://example.com');

	it('has auth', function () {
		expect(sdk.auth).toBeInstanceOf(Auth);
	});

	it('has transport', function () {
		expect(sdk.transport).toBeInstanceOf(AxiosTransport);
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

	it('has utils instance', function () {
		expect(sdk.utils).toBeInstanceOf(UtilsHandler);
	});

	it('has items', async function () {
		expect(sdk.items('collection')).toBeInstanceOf(ItemsHandler);
	});

	test('can run graphql', async function (url, nock) {
		const scope = nock()
			.post('/graphql')
			.times(2)
			.reply(200, {
				data: {
					items: {
						posts: [
							{ id: 1, title: 'My first post' },
							{ id: 2, title: 'My second post' },
						],
					},
				},
			});

		const query = `
			query {
				items {
					posts {
						id
						title
					}
				}
			}
		`;

		const sdk = new Directus(url);

		const response1 = await sdk.graphql(query);
		const response2 = await sdk.gql(query);

		expect(response1).toMatchObject(response2);
		expect(scope.pendingMocks().length).toBe(0);
	});
});
