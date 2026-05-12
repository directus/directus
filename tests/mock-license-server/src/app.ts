import { env } from 'process';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { exportJWK } from 'jose/key/export';
import { requireLicenseVersion } from './hooks/require-license-version.js';
import { activateRoute } from './routes/activate.js';
import { addonsRoute } from './routes/addons.js';
import { adminRoute } from './routes/admin.js';
import { deactivateRoute } from './routes/deactivate.js';
import { portalRoute } from './routes/portal.js';
import { previewRoute } from './routes/preview.js';
import { refreshRoute } from './routes/refresh.js';
import { updateRoute } from './routes/update.js';
import { publicKey } from './utils.js';

const app = Fastify({
	logger: true,
});

app.withTypeProvider<TypeBoxTypeProvider>();

// Test-only routes for sandbox setup
app.register(
	async (admin) => {
		admin.register(adminRoute, { prefix: '/license' });
	},
	{ prefix: '/admin' },
);

app.register(
	async (api) => {
		//  all routes require Directus-License-Version
		api.addHook('preHandler', requireLicenseVersion);

		// license server route mocks
		api.register(previewRoute, { prefix: '/preview' });
		api.register(activateRoute, { prefix: '/activate' });
		api.register(updateRoute, { prefix: '/update' });
		api.register(deactivateRoute, { prefix: '/deactivate' });
		api.register(refreshRoute, { prefix: '/refresh' });
		api.register(portalRoute, { prefix: '/portal' });
		api.register(addonsRoute, { prefix: '/addons' });
	},
	{ prefix: '/api/licenses' },
);

app.get('/.well-known/jwks.json', async (_req, res) => {
	return res.send({
		keys: [await exportJWK(publicKey)],
	});
});

export const startServer = async () => {
	try {
		await app.listen({ port: Number(env['LICENSE_PORT'] ?? 1133) });
		app.log.info(`Server listening on ${app.server.address()}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};
