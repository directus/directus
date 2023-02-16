import logger from '../../logger';
import { getSchema } from '../../utils/get-schema';
import { ItemsService } from '../../services/items';
import type { WebSocketClient } from '../types';
import { fmtMessage, trimUpper } from '../utils/message';
import emitter from '../../emitter';
import { MetaService } from '../../services';
import { sanitizeQuery } from '../../utils/sanitize-query';
import { handleWebsocketException, WebSocketException } from '../exceptions';
import { WebSocketItemsMessage } from '../messages';

export class ItemsHandler {
	constructor() {
		emitter.onAction('websocket.message', ({ client, message }) => {
			if (trimUpper(message.type) !== 'ITEMS') return;
			try {
				this.onMessage(client, WebSocketItemsMessage.parse(message));
			} catch (err) {
				handleWebsocketException(client, err, 'items');
			}
		});
	}
	async onMessage(client: WebSocketClient, message: WebSocketItemsMessage) {
		const uid = message.uid;
		const accountability = client.accountability;
		const schema = await getSchema();
		if (!schema.collections[message.collection]) {
			throw new WebSocketException(
				'items',
				'INVALID_COLLECTION',
				'The provided collection does not exists or is not accessible.',
				uid
			);
		}
		const service = new ItemsService(message.collection, { schema, accountability });
		const metaService = new MetaService({ schema, accountability });
		let result, meta;
		if (message.action === 'create') {
			const query = sanitizeQuery(message?.query ?? {}, accountability);
			if (Array.isArray(message.data)) {
				const keys = await service.createMany(message.data);
				result = await service.readMany(keys, query);
			} else {
				const key = await service.createOne(message.data);
				result = await service.readOne(key, query);
			}
		}
		if (message.action === 'read') {
			const query = sanitizeQuery(message.query, accountability);
			result = await service.readByQuery(query);
			meta = await metaService.getMetaForQuery(message.collection, query);
		}
		if (message.action === 'update') {
			const query = sanitizeQuery(message?.query ?? {}, accountability);
			if (Array.isArray(message.data) && 'ids' in message) {
				const keys = await service.updateMany(message.ids, message.data);
				meta = await metaService.getMetaForQuery(message.collection, query);
				result = await service.readMany(keys, query);
			} else if ('id' in message) {
				const key = await service.updateOne(message.id, message.data);
				result = await service.readOne(key);
			}
		}
		if (message.action === 'delete') {
			if ('ids' in message) {
				await service.deleteMany(message.ids);
				result = message.ids;
			} else if ('id' in message) {
				await service.deleteOne(message.id);
				result = message.id;
			} else if ('query' in message) {
				const query = sanitizeQuery(message.query, accountability);
				result = await service.deleteByQuery(query);
			} else {
				throw new WebSocketException(
					'items',
					'INVALID_PAYLOAD',
					"Either 'ids' or 'id' is required for a DELETE request",
					uid
				);
			}
		}
		logger.debug(`[WS REST] ItemsHandler ${JSON.stringify(message)}`);
		client.send(fmtMessage('items', { data: result, ...(meta ? { meta } : {}) }, uid));
	}
}
