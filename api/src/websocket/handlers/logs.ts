import { LOG_LEVEL, LOG_LEVELS } from '@directus/constants';
import { ErrorCode, ServiceUnavailableError } from '@directus/errors';
import type { Bus } from '@directus/memory';
import { isValidLogLevel } from '@directus/utils';
import { nanoid } from 'nanoid';
import { useBus } from '../../bus/index.js';
import emitter from '../../emitter.js';
import { getLogsController, LogsController } from '../controllers/index.js';
import { handleWebSocketError, WebSocketError } from '../errors.js';
import { WebSocketLogsMessage } from '../messages.js';
import type { LogsSubscription, WebSocketClient } from '../types.js';
import { fmtMessage, getMessageType } from '../utils/message.js';

const logLevelValues = Object.values(LOG_LEVELS);

export class LogsHandler {
	controller: LogsController;
	messenger: Bus;
	nodeId: string;
	subscriptions: LogsSubscription;

	constructor(controller?: LogsController) {
		controller = controller ?? getLogsController();

		if (!controller) {
			throw new ServiceUnavailableError({ service: 'ws', reason: 'WebSocket server is not initialized' });
		}

		this.controller = controller;
		this.messenger = useBus();
		this.nodeId = nanoid(8);

		this.subscriptions = {
			[LOG_LEVEL.TRACE]: new Set(),
			[LOG_LEVEL.DEBUG]: new Set(),
			[LOG_LEVEL.INFO]: new Set(),
			[LOG_LEVEL.WARN]: new Set(),
			[LOG_LEVEL.ERROR]: new Set(),
			[LOG_LEVEL.FATAL]: new Set(),
		};

		this.bindWebSocket();

		this.messenger.subscribe('logs', (message: string) => {
			const log = JSON.parse(message);
			const logLevel = log['level'];

			if (logLevel) {
				this.subscriptions[logLevel as LOG_LEVEL].forEach((subscription) =>
					subscription.send(fmtMessage('logs', { data: log }, this.nodeId)),
				);
			}
		});
	}

	/**
	 * Hook into websocket client lifecycle events
	 */
	bindWebSocket() {
		// listen to incoming messages on the connected websockets
		emitter.onAction('websocket.logs', ({ client, message }) => {
			if (!['subscribe', 'unsubscribe'].includes(getMessageType(message))) return;

			try {
				const parsedMessage = WebSocketLogsMessage.parse(message);

				this.onMessage(client, parsedMessage).catch((error) => {
					// this catch is required because the async onMessage function is not awaited
					handleWebSocketError(client, error, 'logs');
				});
			} catch (error) {
				handleWebSocketError(client, error, 'logs');
			}
		});

		// unsubscribe when a connection drops
		emitter.onAction('websocket.error', ({ client }) => this.unsubscribe(client));
		emitter.onAction('websocket.close', ({ client }) => this.unsubscribe(client));
	}

	/**
	 * Register a logs subscription
	 * @param logLevel
	 * @param client
	 */
	subscribe(logLevel: LOG_LEVEL, client: WebSocketClient) {
		for (const value of logLevelValues) {
			if (value >= logLevel) {
				this.subscriptions[value].add(client);
			} else {
				this.subscriptions[value].delete(client);
			}
		}
	}

	/**
	 * Remove a logs subscription
	 * @param client WebSocketClient
	 */
	unsubscribe(client: WebSocketClient) {
		for (const value of logLevelValues) {
			this.subscriptions[value].delete(client);
		}
	}

	/**
	 * Handle incoming (un)subscribe requests
	 */
	async onMessage(client: WebSocketClient, message: WebSocketLogsMessage) {
		const accountability = client.accountability;

		if (!accountability?.admin) {
			throw new WebSocketError('logs', ErrorCode.Forbidden, `You don't have permission to access this.`);
		}

		if (message.type === 'subscribe') {
			try {
				const logLevel = message.log_level;

				if (isValidLogLevel(logLevel)) {
					this.subscribe(LOG_LEVELS[logLevel], client);
					client.send(fmtMessage('logs', { event: 'subscribe', log_level: logLevel }));
				}
			} catch (err) {
				handleWebSocketError(client, err, 'subscribe');
			}
		} else if (message.type === 'unsubscribe') {
			try {
				this.unsubscribe(client);

				client.send(fmtMessage('logs', { event: 'unsubscribe' }));
			} catch (err) {
				handleWebSocketError(client, err, 'unsubscribe');
			}
		}
	}
}
