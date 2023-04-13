import { getUrl } from '@common/config';
import * as common from '@common/index';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';
import { collectionFirst } from './graphql.seed';
import { v4 as uuid } from 'uuid';

describe('WebSocket REST Tests', () => {
	describe.each(common.PRIMARY_KEY_TYPES)('Primary key type: %s', (pkType) => {
		const localCollectionFirst = `${collectionFirst}_${pkType}`;

		describe('Test subscriptions', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const uids = [undefined, 1, 'two'];
					const wsGql = common.createWebSocketGql(getUrl(vendor), {
						auth: { access_token: common.USER.ADMIN.TOKEN },
					});
					const messageList = [];
					let subscriptionKey = '';

					// Action
					for (const uid of uids) {
						subscriptionKey = await wsGql.subscribe({
							collection: localCollectionFirst,
							jsonQuery: {
								id: true,
								name: true,
								// _event: true,
							},
							uid,
						});
					}

					const insertedName = uuid();
					const insertedId = (
						await request(getUrl(vendor))
							.post(`/items/${localCollectionFirst}`)
							.send({ id: pkType === 'string' ? uuid() : undefined, name: insertedName })
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					).body.data.id;

					for (const uid of uids) {
						messageList.push(await wsGql.getMessages(1, { uid }));
					}

					await request(getUrl(vendor))
						.post(`/items/${localCollectionFirst}`)
						.send({ id: pkType === 'string' ? uuid() : undefined, name: insertedName })
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					await wsGql.client.dispose();

					// Assert
					for (let i = 0; i < messageList.length; i++) {
						const wsMessages = messageList[i];
						expect(wsMessages?.length).toBe(1);
						expect(wsMessages![0]).toEqual({
							data: {
								[subscriptionKey]: {
									_event: 'create',
									id: String(insertedId),
									name: insertedName,
								},
							},
						});
					}
				},
				100000
			);
		});
	});
});
