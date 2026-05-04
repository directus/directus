import { env } from 'process';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { exportJWK } from 'jose/key/export';
import { activateRoute } from './routes/activate.js';
import { checkRoute } from './routes/check.js';
import { deactivateRoute } from './routes/deactivate.js';
import { licenseRoute } from './routes/license.js';
import { refreshRoute } from './routes/refresh.js';
import { publicKey } from './token.js';

const app = Fastify({
	logger: true,
});

app.withTypeProvider<TypeBoxTypeProvider>();

app.register(checkRoute, { prefix: '/api/licenses/check' });
app.register(activateRoute, { prefix: '/api/licenses/activate' });
app.register(deactivateRoute, { prefix: '/api/licenses/deactivate' });
app.register(licenseRoute, { prefix: '/admin/license' });
app.register(refreshRoute, { prefix: '/api/licenses/refresh' });

app.get('/.well-known/jwks.json', async (_req, res) => {
	return res.send({
		keys: [await exportJWK(publicKey)],
	});
});

const start = async () => {
	try {
		await app.listen({ port: Number(env['LICENSE_PORT'] ?? 1133) });
		app.log.info(`Server listening on ${app.server.address()}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
