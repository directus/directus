import { env } from 'process';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { exportJWK } from 'jose/key/export';
import { activateRoute } from './routes/activate.js';
import { addonsRoute } from './routes/addons.js';
import { deactivateRoute } from './routes/deactivate.js';
import { licenseRoute } from './routes/license.js';
import { portalRoute } from './routes/portal.js';
import { previewRoute } from './routes/preview.js';
import { refreshRoute } from './routes/refresh.js';
import { updateRoute } from './routes/update.js';
import { publicKey } from './token.js';

const app = Fastify({
	logger: true,
});

app.withTypeProvider<TypeBoxTypeProvider>();

// routes inteded to be utilized test setup
app.register(licenseRoute, { prefix: '/admin/license' });

// license server route mocks
app.register(previewRoute, { prefix: '/api/licenses/preview' });
app.register(activateRoute, { prefix: '/api/licenses/activate' });
app.register(updateRoute, { prefix: '/api/licenses/update' });
app.register(deactivateRoute, { prefix: '/api/licenses/deactivate' });
app.register(refreshRoute, { prefix: '/api/licenses/refresh' });
app.register(portalRoute, { prefix: '/api/licenses/portal' });
app.register(addonsRoute, { prefix: '/api/licenses/addons' });

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
