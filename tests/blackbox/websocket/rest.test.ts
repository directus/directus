import { getUrl } from '@common/config';
import * as common from '@common/index';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';
import { collectionFirst } from './rest.seed';
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
					const ws = common.createWebSocketConn(getUrl(vendor), {
						auth: { access_token: common.USER.ADMIN.TOKEN },
					});
					const messageList = [];

					// Action
					for (const uid of uids) {
						await ws.subscribe({ collection: localCollectionFirst, uid });
					}

					const insertedName = uuid();
					const insertedId = (
						await request(getUrl(vendor))
							.post(`/items/${localCollectionFirst}`)
							.send({ id: pkType === 'string' ? uuid() : undefined, name: insertedName })
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					).body.data.id;

					for (const uid of uids) {
						messageList.push(await ws.getMessages(1, { uid }));
					}

					ws.conn.close();

					// Assert
					for (let i = 0; i < messageList.length; i++) {
						const wsMessages = messageList[i];
						expect(wsMessages?.length).toBe(1);
						expect(wsMessages![0]).toEqual({
							type: 'subscription',
							event: 'create',
							payload: [{ id: insertedId, name: insertedName }],
							uid: uids[i] === undefined ? undefined : String(uids[i]),
						});
					}
				},
				100000
			);
		});
	});
});
