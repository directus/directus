import type { Server } from 'graphql-ws';
import { CloseCode, MessageType, makeServer } from 'graphql-ws';
import type { Server as httpServer } from 'http';
import type { WebSocket } from 'ws';
import env from '../../env.js';
import logger from '../../logger.js';
import { bindPubSub } from '../../services/graphql/subscription.js';
import { GraphQLService } from '../../services/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { authenticateConnection, refreshAccountability } from '../authenticate.js';
import { handleWebSocketError } from '../errors.js';
import { ConnectionParams, WebSocketMessage } from '../messages.js';
import type { AuthenticationState, GraphQLSocket, UpgradeContext, WebSocketClient } from '../types.js';
import { getMessageType } from '../utils/message.js';
import SocketController from './base.js';

export class GraphQLSubscriptionController extends SocketController {
	gql: Server<GraphQLSocket>;
	constructor(httpServer: httpServer) {
		super(httpServer, 'WEBSOCKETS_GRAPHQL');

		this.server.on('connection', (ws: WebSocket, auth: AuthenticationState) => {
			this.bindEvents(this.createClient(ws, auth));
		});

		this.gql = makeServer<ConnectionParams, GraphQLSocket>({
			schema: async (ctx) => {
				const accountability = ctx.extra.client.accountability;

				// for now only the items will be watched, system events tbd
				const service = new GraphQLService({
					schema: await getSchema(),
					scope: 'items',
					accountability,
				});

				return service.getSchema();
			},
		});

		bindPubSub();
		logger.info(`GraphQL Subscriptions started at ws://${env['HOST']}:${env['PORT']}${this.endpoint}`);
	}

	private bindEvents(client: WebSocketClient) {
		const closedHandler = this.gql.opened(
			{
				protocol: client.protocol,
				send: (data) =>
					new Promise((resolve, reject) => {
						client.send(data, (err) => (err ? reject(err) : resolve()));
					}),
				close: (code, reason) => client.close(code, reason), // for standard closures
				onMessage: (cb) => {
					client.on('parsed-message', async (message: WebSocketMessage) => {
						try {
							if (getMessageType(message) === 'connection_init' && this.authentication.mode !== 'strict') {
								const params = ConnectionParams.parse(message['payload'] ?? {});

								if (this.authentication.mode === 'handshake') {
									if (typeof params.access_token === 'string') {
										const { accountability, expires_at } = await authenticateConnection({
											access_token: params.access_token,
										});

										client.accountability = accountability;
										client.expires_at = expires_at;
									} else {
										client.close(CloseCode.Forbidden, 'Forbidden');
										return;
									}
								}
							} else if (this.authentication.mode === 'handshake' && !client.accountability?.user) {
								// the first message should authenticate successfully in this mode
								client.close(CloseCode.Forbidden, 'Forbidden');
								return;
							} else {
								client.accountability = await refreshAccountability(client.accountability);
							}

							await cb(JSON.stringify(message));
						} catch (error) {
							handleWebSocketError(client, error, MessageType.Error);
						}
					});
				},
			},
			{ client }
		);

		// notify server that the socket closed
		client.once('close', (code, reason) => closedHandler(code, reason.toString()));

		// check strict authentication status
		if (this.authentication.mode === 'strict' && !client.accountability?.user) {
			client.close(CloseCode.Forbidden, 'Forbidden');
		}
	}

	override setTokenExpireTimer(client: WebSocketClient) {
		if (client.auth_timer !== null) {
			clearTimeout(client.auth_timer);
			client.auth_timer = null;
		}

		if (this.authentication.mode !== 'handshake') return;

		client.auth_timer = setTimeout(() => {
			if (!client.accountability?.user) {
				client.close(CloseCode.Forbidden, 'Forbidden');
			}
		}, this.authentication.timeout);
	}

	protected override async handleHandshakeUpgrade({ request, socket, head }: UpgradeContext) {
		this.server.handleUpgrade(request, socket, head, async (ws) => {
			this.server.emit('connection', ws, { accountability: null, expires_at: null });
			// actual enforcement is handled by the setTokenExpireTimer function
		});
	}
}
