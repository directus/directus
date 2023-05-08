// @ts-nocheck

import JWT from 'jsonwebtoken';
import SC from 'socketcluster-client';
import logger from '../logger';

function genToken() {
	return JWT.sign({ type: 'service' }, process.env.SECRET, {
		expiresIn: '1 year',
	});
}

const socketcluster = {
	async connect() {
		const socketConfig = {
			hostname: process.env.NEURON_SOCKET_HOSTNAME,
			port: process.env.NEURON_SOCKET_PORT,
			secure: process.env.NEURON_SOCKET_SECURE === 'true',
			rejectUnauthorized: false,
			path: '/v2/',
		};

		const options = {
			...socketConfig,
			query: {
				type: 'service',
			},
			autoReconnect: true,
			disconnectOnUnload: true,
			ackTimeout: 60 * 60 * 1000,
			authEngine: {
				saveToken: () => {
					//
				},
				removeToken: () => {
					//
				},
				loadToken: async () => genToken(),
			},
			// codecEngine: SocketCodecEngine
		};

		this.client = SC.create(options);

		(async () => {
			for await (const status of this.client.listener('connect')) {
				if (!status.isAuthenticated) {
					throw new Error('Socket authentication failed');
				}

				logger.info(`Connected to socket://${options.hostname}:${options.port}`);
			}
		})();

		(async () => {
			for await (const error of this.client.listener('error')) {
				logger.error(error);
			}
		})();

		(async () => {
			for await (const { code, reason } of this.client.listener('disconnect')) {
				logger.error(`Disconnected from socket: ${code} ${reason}`);
			}
		})();
	},

	async transmit(event, data) {
		this.client.transmit(event, data);
	},

	async invoke(event, data) {
		return this.client.invoke(event, data);
	},
};

export default socketcluster;
