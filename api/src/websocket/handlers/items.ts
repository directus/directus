// import logger from '../../logger';
import { getSchema } from '../../utils/get-schema';
import { ItemsService, MetaService } from '../../services';
import type { WebSocketClient } from '../types';
import { fmtMessage, getMessageType } from '../utils/message';
import emitter from '../../emitter';
import { sanitizeQuery } from '../../utils/sanitize-query';
import { handleWebsocketException, WebSocketException } from '../exceptions';
import { WebSocketItemsMessage } from '../messages';

export class ItemsHandler {
	constructor() {
		emitter.onAction('websocket.message', ({ client, message }) => {
			if (getMessageType(message) !== 'items') return;
			try {
				const parsedMessage = WebSocketItemsMessage.parse(message);
				this.onMessage(client, parsedMessage).catch((err) => {
					// this catch is required because the async onMessage function is not awaited
					handleWebsocketException(client, err, 'items');
				});
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
			const query = sanitizeQuery(message.query ?? {}, accountability);
			if (message.id) {
				result = await service.readOne(message.id, query);
			} else if (message.ids) {
				result = await service.readMany(message.ids, query);
			} else {
				result = await service.readByQuery(query);
			}
			meta = await metaService.getMetaForQuery(message.collection, query);
		}
		if (message.action === 'update') {
			const query = sanitizeQuery(message.query ?? {}, accountability);
			if (message.id) {
				const key = await service.updateOne(message.id, message.data);
				result = await service.readOne(key);
			} else if (message.ids) {
				const keys = await service.updateMany(message.ids, message.data);
				meta = await metaService.getMetaForQuery(message.collection, query);
				result = await service.readMany(keys, query);
			} else {
				const keys = await service.updateByQuery(query, message.data);
				meta = await metaService.getMetaForQuery(message.collection, query);
				result = await service.readMany(keys, query);
			}
		}
		if (message.action === 'delete') {
			if (message.id) {
				await service.deleteOne(message.id);
				result = message.id;
			} else if (message.ids) {
				await service.deleteMany(message.ids);
				result = message.ids;
			} else if (message.query) {
				const query = sanitizeQuery(message.query, accountability);
				result = await service.deleteByQuery(query);
			} else {
				throw new WebSocketException(
					'items',
					'INVALID_PAYLOAD',
					"Either 'ids', 'id' or 'query' is required for a DELETE request",
					uid
				);
			}
		}
		// logger.debug(`[WS REST] ItemsHandler ${JSON.stringify(message)}`);
		client.send(fmtMessage('items', { data: result, ...(meta ? { meta } : {}) }, uid));
	}
}
