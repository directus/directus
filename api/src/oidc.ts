/**
 * Grant is the oAuth library
 */

import env from './env';
import { toArray } from './utils/to-array';
import { getConfigFromEnv } from './utils/get-config-from-env';
import getDatabase from './database';

const enabledClients = toArray(env.OIDC_CLIENTS).map((client) => client.toLowerCase());

const config: any = {
	clients: {},
	cookies: {
		keys: env.OIDC_SECURE_KEY.split(','),
	},
	findAccount: async (_ctx: any, id: any) => {
		const database = getDatabase();
		const user = await database
			.select('directus_users.id', 'email', 'role', 'directus_roles.admin_access', 'directus_roles.app_access')
			.from('directus_users')
			.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
			.where({
				'directus_users.id': id,
				status: 'active',
			})
			.first();

		if (!user) {
			return undefined;
		}

		return {
			accountId: user.id,
			async claims() {
				return {
					sub: user.id,
					email: user.email,
				};
			},
		};
	},
	claims: {
		openid: ['sub'],
		email: ['email'],
	},

	// let's tell oidc-provider where our own interactions will be
	// setting a nested route is just good practice so that users
	// don't run into weird issues with multiple interactions open
	// at a time.
	interactions: {
		url(_ctx: any, interaction: { uid: any }) {
			return `/interaction/${interaction.uid}`;
		},
	},
	features: {
		// disable the packaged interactions
		devInteractions: { enabled: false },
	},
};

for (const client of enabledClients) {
	config.clients[client] = getConfigFromEnv(`OIDC_${client.toUpperCase()}_`, undefined, 'underscore');

	for (const key of Object.keys(config.clients[client])) {
		try {
			config.clients[client][key] = JSON.parse(config.clients[client][key]);
			// eslint-disable-next-line no-empty
		} catch (e) {}
	}
}

config.clients = Object.values(config.clients);

export default config;
