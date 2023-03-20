import type { Server as httpServer } from 'http';
import { makeServer, Server, MessageType, CloseCode } from 'graphql-ws';
import type { WebSocket } from 'ws';
import logger from '../../logger';
import { getSchema } from '../../utils/get-schema';
import { GraphQLService } from '../../services';
import env from '../../env';
import SocketController from './base';
import type {
	AuthenticationState,
	AuthMode,
	ConnectionParams,
	GraphQLSocket,
	UpgradeContext,
	WebSocketClient,
} from '../types';
import { handleWebsocketException } from '../exceptions';
import { authenticateConnection, refreshAccountability } from '../authenticate';
import { BasicAuthMessage, WebSocketMessage } from '../messages';
import { getMessageType } from '../utils/message';
import { bindPubSub } from '../../services/graphql/subscription';

export class GraphQLSubscriptionController extends SocketController {
	gql: Server<GraphQLSocket>;
	constructor(httpServer: httpServer) {
		super(httpServer, 'WS GraphQL', String(env.WEBSOCKETS_GRAPHQL_PATH), {
			mode: String(env.WEBSOCKETS_GRAPHQL_AUTH).toLowerCase() as AuthMode,
			timeout: Number(env.WEBSOCKETS_GRAPHQL_AUTH_TIMEOUT) * 1000,
		});
		if ('WEBSOCKETS_GRAPHQL_CONN_LIMIT' in env) {
			this.maxConnections = Number(env.WEBSOCKETS_GRAPHQL_CONN_LIMIT);
		}
		this.server.on('connection', (ws: WebSocket, auth: AuthenticationState) => {
			this.bindEvents(this.createClient(ws, auth));
		});
		this.gql = makeServer<ConnectionParams, GraphQLSocket>({
			schema: async (ctx) => {
				const accountability = ctx.extra.client.accountability;

				// for now only the items will be watched in the MVP system events tbd
				const service = new GraphQLService({
					schema: await getSchema(),
					scope: 'items',
					accountability,
				});

				return service.getSchema();
			},
		});
		bindPubSub();
		logger.info(`GraphQL Subscriptions started at ws://${env.HOST}:${env.PORT}${this.endpoint}`);
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
							if (getMessageType(message) === 'connection_init') {
								const { accountability, expires_at } = await authenticateConnection(
									BasicAuthMessage.parse(message.payload)
								);
								client.accountability = accountability;
								client.expires_at = expires_at;
							} else if (this.authentication.mode === 'handshake' && !client.accountability?.user) {
								// the first message should authenticate successfully in this mode
								client.close(CloseCode.Forbidden, 'Forbidden');
								return;
							} else {
								client.accountability = await refreshAccountability(client.accountability);
							}
							await cb(JSON.stringify(message));
						} catch (error) {
							handleWebsocketException(client, error, MessageType.Error);
						}
					});
				},
			},
			{ client }
		);

		// notify server that the socket closed
		client.once('close', (code, reason) => closedHandler(code, reason.toString()));
	}
	setTokenExpireTimer(client: WebSocketClient) {
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
