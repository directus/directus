import { useBus } from '../../bus/index.js';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { getAllowedLogLevels } from '../../utils/get-allowed-log-levels.js';
import { getLogsController, LogsController } from '../controllers/index.js';
import { handleWebSocketError, WebSocketError } from '../errors.js';
import { WebSocketLogsMessage } from '../messages.js';
import type { LogsSubscription, WebSocketClient } from '../types.js';
import { fmtMessage, getMessageType } from '../utils/message.js';
import { ErrorCode, ServiceUnavailableError } from '@directus/errors';
import type { Bus } from '@directus/memory';

const logger = useLogger();

export class LogsHandler {
	controller: LogsController;
	messenger: Bus;
	availableLogLevels: string[];
	logLevelValueMap: Record<string, string>;
	subscriptions: LogsSubscription;

	constructor(controller?: LogsController) {
		controller = controller ?? getLogsController();

		if (!controller) {
			throw new ServiceUnavailableError({ service: 'ws', reason: 'WebSocket server is not initialized' });
		}

		this.controller = controller;
		this.messenger = useBus();
		this.availableLogLevels = Object.keys(logger.levels.values);

		this.logLevelValueMap = Object.fromEntries(
			Object.entries(logger.levels.values).map(([key, value]) => [value, key]),
		);

		this.subscriptions = this.availableLogLevels.reduce((acc, logLevel) => {
			acc[logLevel] = new Set();
			return acc;
		}, {} as LogsSubscription);

		this.bindWebSocket();

		this.messenger.subscribe('logs', (message: string) => {
			const { log, nodeId } = JSON.parse(message);
			const logLevel = this.logLevelValueMap[log['level']];

			if (logLevel) {
				this.subscriptions[logLevel]?.forEach((subscription) =>
					subscription.send(fmtMessage('logs', { data: log }, nodeId)),
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
	subscribe(logLevel: string, client: WebSocketClient) {
		let allowedLogLevelNames = [];

		try {
			allowedLogLevelNames = Object.keys(getAllowedLogLevels(logLevel));
		} catch (error) {
			throw new WebSocketError('logs', ErrorCode.InvalidPayload, (error as Error).message);
		}

		for (const availableLogLevel of this.availableLogLevels) {
			if (allowedLogLevelNames.includes(availableLogLevel)) {
				this.subscriptions[availableLogLevel]?.add(client);
			} else {
				this.subscriptions[availableLogLevel]?.delete(client);
			}
		}
	}

	/**
	 * Remove a logs subscription
	 * @param client WebSocketClient
	 */
	unsubscribe(client: WebSocketClient) {
		for (const availableLogLevel of this.availableLogLevels) {
			this.subscriptions[availableLogLevel]?.delete(client);
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

				this.subscribe(logLevel, client);
				client.send(fmtMessage('logs', { event: 'subscribe', log_level: logLevel }));
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
