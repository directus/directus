import type { FocusMessage, WebSocketClient } from '../types';
import emitter from '../../emitter';
// import logger from '../../logger';
import { handleWebsocketException } from '../exceptions';

type UserFocus = {
	user: string;
	client: WebSocketClient;
	collection: string;
	item: string;
	field: string | false;
};
type UserStatus = 'online' | 'idle' | 'offline';

export class UsersHandler {
	userStatus: Record<string, UserStatus>;
	userFocus: Record<string, UserFocus>;

	constructor() {
		this.userStatus = {};
		this.userFocus = {};
		this.bindWebsocketEvents();
	}
	bindWebsocketEvents() {
		emitter.onAction('websocket.message', ({ client, message }) => {
			try {
				this.onMessage(client, message as FocusMessage);
			} catch (error) {
				handleWebsocketException(client, error, 'users');
			}
		});
		emitter.onAction('websocket.auth.success', ({ client }) => {
			const userId = client.accountability?.user;
			if (!userId) return;
			this.updateStatus(userId, 'online');
		});
		emitter.onAction('websocket.connect', ({ client }) => this.clearClient(client));
		emitter.onAction('websocket.error', ({ client }) => this.clearClient(client));
		emitter.onAction('websocket.close', ({ client }) => this.clearClient(client));
		emitter.onAction('websocket.auth.failure', ({ client }) => this.clearClient(client));
	}
	async onMessage(client: WebSocketClient, message: FocusMessage) {
		const userId = client.accountability?.user;
		if (!userId) return;
		if (message.type === 'BLUR') {
			this.updateFocus(userId, false);
		}
		if (message.type === 'FOCUS') {
			const { collection, item, field } = message;
			this.updateFocus(userId, {
				user: userId,
				client,
				collection,
				item,
				field,
			});
		}
	}
	clearClient(client: WebSocketClient) {
		const userId = client.accountability?.user;
		if (!userId) return;
		this.updateStatus(userId, 'offline');
		if (userId in this.userFocus) {
			delete this.userFocus[userId];
		}
	}
	updateStatus(userId: string, status: UserStatus) {
		if (status === 'offline') {
			// we don't need to store all offline users
			if (userId in this.userStatus) delete this.userStatus[userId];
		} else {
			this.userStatus[userId] = status;
		}
		// this.dispatch(userId);
	}
	updateFocus(userId: string, focus: UserFocus | false) {
		if (focus === false) {
			if (userId in this.userFocus) {
				const { collection, item } = this.userFocus[userId]!;
				delete this.userFocus[userId];
				this.dispatchFocus(userId, collection, item);
			}
		} else {
			this.userFocus[userId] = focus;
			this.dispatchFocus(userId, focus.collection, focus.item);
		}
	}
	dispatchFocus(user: string, collection: string, item: string) {
		for (const focus of Object.values(this.userFocus)) {
			if (focus.user === user || focus.collection !== collection || focus.item !== item) continue;
			if (user in this.userFocus) {
				focus.client.send(JSON.stringify({ type: 'FOCUS', user, field: this.userFocus[user]!.field }));
			} else {
				focus.client.send(JSON.stringify({ type: 'BLUR', user }));
			}
		}
	}
}
