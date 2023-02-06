import logger from '../../logger';
import { getSchema } from '../../utils/get-schema';
import { ItemsService } from '../../services/items';
import type { WebSocketClient, WebSocketMessage } from '../types';
import { fmtMessage, trimUpper } from '../utils/message';
import emitter from '../../emitter';
import { MetaService } from '../../services';
import { sanitizeQuery } from '../../utils/sanitize-query';
import { handleWebsocketException, WebSocketException } from '../exceptions';

export class ItemsHandler {
	constructor() {
		emitter.onAction('websocket.message', ({ client, message }) => {
			try {
				this.onMessage(client, message);
			} catch (err) {
				handleWebsocketException(client, err, 'items');
			}
		});
	}
	async onMessage(client: WebSocketClient, message: WebSocketMessage) {
		if (trimUpper(message.type) !== 'ITEMS') return;
		const uid = message.uid;
		const accountability = client.accountability;
		const schema = await getSchema();
		if (!schema.collections[message['collection']]) {
			throw new WebSocketException(
				'items',
				'INVALID_COLLECTION',
				'The provided collection does not exists or is not accessible.',
				uid
			);
		}
		const service = new ItemsService(message['collection'], { schema, accountability });
		const metaService = new MetaService({ schema, accountability });
		if (!['create', 'read', 'update', 'delete'].includes(message['action'])) {
			throw new WebSocketException('items', 'INVALID_ACTION', 'Invalid action provided.', uid);
		}
		const query = sanitizeQuery(message['query'], accountability);
		let result, meta;
		switch (message['action']) {
			case 'create':
				if (Array.isArray(message['data'])) {
					const keys = await service.createMany(message['data']);
					result = await service.readMany(keys, query);
				} else if (!message['data']) {
					throw new WebSocketException('items', 'INVALID_PAYLOAD', 'Invalid payload in "data".', uid);
				} else {
					const key = await service.createOne(message['data']);
					result = await service.readOne(key, query);
				}
				break;
			case 'read':
				if (!query) {
					throw new WebSocketException('items', 'INVALID_QUERY', 'Invalid query provided.', uid);
				}
				result = await service.readByQuery(query);
				meta = await metaService.getMetaForQuery(message['collection'], query);
				break;
			case 'update':
				if (Array.isArray(message['data'])) {
					const keys = await service.updateMany(message['ids'], message['data']);
					meta = await metaService.getMetaForQuery(message['collection'], query);
					result = await service.readMany(keys, query);
				} else if (!message['data']) {
					throw new WebSocketException('items', 'INVALID_PAYLOAD', 'Invalid payload in "data".', uid);
				} else {
					const key = await service.updateOne(message['id'], message['data']);
					result = await service.readOne(key);
				}
				break;
			case 'delete':
				if (message['keys']) {
					await service.deleteMany(message['keys']);
					result = message['keys'];
				} else if (message['key']) {
					await service.deleteOne(message['key']);
					result = message['key'];
				} else {
					throw new WebSocketException(
						'items',
						'INVALID_PAYLOAD',
						"Either 'keys' or 'key' is required for a DELETE request",
						uid
					);
				}
				break;
		}
		logger.debug(`[WS REST] ItemsHandler ${JSON.stringify(message)}`);
		client.send(fmtMessage('items', { data: result, ...(meta ? { meta } : {}) }, uid));
	}
}
