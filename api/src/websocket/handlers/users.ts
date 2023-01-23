import type { FocusMessage, WebSocketClient } from '../types';
import emitter from '../../emitter';
import { handleWebsocketException } from '../exceptions';
import logger from '../../logger';

type UserFocus = {
	user: string;
	client: WebSocketClient;
	collection: string;
	item: string;
	field: string | false;
};
type UserStatus = 'online' | 'idle' | 'offline';

export class UsersHandler {
	userStatus: Map<string, UserStatus>;
	userFocus: UserFocus[];

	constructor() {
		this.userStatus = new Map();
		this.userFocus = [];
		// this.userFocus = new Map();
		// this.focusMap = {};
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
		logger.info('msg: ' + JSON.stringify(message));
		if (message.type === 'FOCUS') {
			const { collection, item, field } = message;
			let oldCollection: string | undefined, oldItem: string | undefined;
			const idx = this.userFocus.findIndex(({ client: _c }) => _c === client);
			if (idx === -1) {
				this.userFocus.push({ client, user: userId, collection, item, field });
			} else {
				oldCollection = this.userFocus[idx]?.collection;
				oldItem = this.userFocus[idx]?.item;
				this.userFocus[idx] = { client, user: userId, collection, item, field };
			}

			if (oldCollection !== undefined && oldItem !== undefined && (oldCollection !== collection || oldItem !== item)) {
				this.dispatchFocus(oldCollection, oldItem);
			}
			this.dispatchFocus(collection, item);
		}
		if (message.type === 'BLUR') {
			const oldFocus = this.userFocus.find((focus) => focus.user === userId);
			this.userFocus = this.userFocus.filter(({ user }) => user !== userId);
			if (oldFocus) {
				this.dispatchFocus(oldFocus.collection, oldFocus.item);
			}
		}
	}
	clearClient(client: WebSocketClient) {
		const userId = client.accountability?.user;
		if (!userId) return;
		this.updateStatus(userId, 'offline');
		this.userFocus = this.userFocus.filter(({ user }) => user !== userId);
	}
	updateStatus(userId: string, status: UserStatus) {
		if (status === 'offline') {
			// we don't need to store all offline users
			if (this.userStatus.has(userId)) this.userStatus.delete(userId);
		} else {
			this.userStatus.set(userId, status);
		}
		// this.dispatch(userId);
	}
	dispatchFocus(collection: string, item: string) {
		const collaborators = this.userFocus.filter((focus) => focus.collection === collection && focus.item === item);
		for (const focus of collaborators) {
			focus.client.send(
				JSON.stringify({
					type: 'FOCUS',
					collaborators: collaborators
						.filter((collab) => collab.user !== focus.user)
						.reduce((result, { user, field }) => ({ ...result, [user]: field }), {}),
				})
			);
		}
	}
}
