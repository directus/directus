import type { Server as httpServer } from 'http';
import { makeServer, Server } from 'graphql-ws';
import type { WebSocket } from 'ws';
import logger from '../../logger';
import { getAccountabilityForToken } from '../../utils/get-accountability-for-token';
import { getSchema } from '../../utils/get-schema';
import { GraphQLService } from '../../services';
import env from '../../env';
import SocketController from './base';
import type { AuthenticationState, ConnectionParams, UpgradeContext, WebSocketClient } from '../types';
import { handleWebsocketException, WebSocketException } from '../exceptions';
import { authenticateConnection, refreshAccountability } from '../authenticate';
import { waitForAnyMessage } from '../utils/wait-for-message';
import { WebSocketAuthMessage, WebSocketMessage } from '../messages';

export class GraphQLSubscriptionController extends SocketController {
	gql: Server<ConnectionParams>;
	constructor(httpServer: httpServer) {
		super(httpServer, 'WS GraphQL', env['WEBSOCKETS_GRAPHQL_PATH'], {
			mode: env['WEBSOCKETS_GRAPHQL_AUTH'].toLowerCase(),
			timeout: env['WEBSOCKETS_GRAPHQL_AUTH_TIMEOUT'] * 1000,
			verbose: false,
		});
		if ('WEBSOCKETS_GRAPHQL_CONN_LIMIT' in env) {
			this.maxConnections = Number(env['WEBSOCKETS_GRAPHQL_CONN_LIMIT']);
		}
		this.server.on('connection', (ws: WebSocket, auth: AuthenticationState) => {
			this.bindEvents(this.createClient(ws, auth));
		});
		this.gql = makeServer<ConnectionParams>({
			schema: async (ctx) => {
				const accountability = await getAccountabilityForToken(ctx.connectionParams?.access_token);

				const service = new GraphQLService({
					schema: await getSchema(),
					scope: 'items',
					accountability,
				});

				return service.getSchema();
			},
		});
		logger.info(`Subscriptions available at ws://${env['HOST']}:${env['PORT']}${this.endpoint}`);
	}
	private bindEvents(client: WebSocketClient) {
		const closedHandler = this.gql.opened(
			{
				protocol: client.protocol, // will be validated
				send: (data) =>
					new Promise((resolve, reject) => {
						client.send(data, (err) => (err ? reject(err) : resolve()));
					}),
				close: (code, reason) => client.close(code, reason), // for standard closures
				onMessage: (cb) => {
					client.on('parsed-message', async (message: WebSocketMessage) => {
						try {
							client.accountability = await refreshAccountability(client.accountability);
							await cb(JSON.stringify(message));
						} catch (error) {
							handleWebsocketException(client, error);
						}
					});
				},
			},
			{}
		);

		// notify server that the socket closed
		client.once('close', (code, reason) => closedHandler(code, reason.toString()));
	}
	protected override async handleHandshakeUpgrade({ request, socket, head }: UpgradeContext) {
		this.server.handleUpgrade(request, socket, head, async (ws) => {
			try {
				const msg: WebSocketMessage = await waitForAnyMessage(ws, this.authentication.timeout);
				if (msg.type !== 'connection_init') throw new Error();

				const state = await authenticateConnection(WebSocketAuthMessage.parse(msg['payload']));
				this.server.emit('connection', ws, state);
				ws.send(JSON.stringify({ type: 'connection_ack' }));
				this.server.emit('message-parsed', msg);
			} catch {
				const error = new WebSocketException('auth', 'AUTH_FAILED', 'Authentication handshake failed.');
				handleWebsocketException(ws, error, 'auth');
				ws.close();
			}
		});
	}
}
