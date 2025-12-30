import { isDeniedIp } from './is-denied-ip.js';
import type { Agent, ClientRequestArgs } from 'node:http';
import { isIP } from 'node:net';

/**
 * 'createConnection' is missing in 'Agent' type, but assigned in actual implementation:
 * https://github.com/nodejs/node/blob/8a41d9b636be86350cd32847c3f89d327c4f6ff7/lib/_http_agent.js#L215
 */
export type _Agent = Agent & { createConnection: ClientRequestArgs['createConnection'] };

const deniedError = (domain: string) => new Error(`Requested domain "${domain}" resolves to a denied IP address`);

/** Extends a HTTP agent with IP validation */
export const agentWithIpValidation = (agent: Agent) => {
	const _agent = agent as _Agent;

	const { createConnection } = _agent;

	_agent.createConnection = function (options, oncreate) {
		const { host } = options;

		/*
		 * Unexpected, but according to the types 'host' might be undefined.
		 * In that case, the request is denied to be on the safe side,
		 * since the host cannot be verified.
		 */
		if (!host) {
			throw new Error('Request cannot be verified due to missing host');
		}

		/*
		 * At this point, host is only verified if it's already an IP address.
		 * Otherwise it will be verified on 'lookup' event.
		 */
		if (isIP(host) !== 0 && isDeniedIp(host)) throw deniedError(host);

		const socket = createConnection?.call(this, options, oncreate);

		// Unexpected, but in that case the request is denied to be on the safe side
		if (!socket) {
			throw new Error('Request cannot be verified due to lost socket');
		}

		// Emitted after resolving the host name but before connecting.
		socket.on('lookup', (error, address) => {
			if (error || !isDeniedIp(address)) return;

			return socket.destroy(deniedError(host));
		});

		return socket;
	};

	return agent;
};
