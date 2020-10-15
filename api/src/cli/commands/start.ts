import logger from '../../logger';
import emitter from '../../emitter';

export default async function start() {
	const env = require('../../env').default;
	const { validateDBConnection } = require('../../database');
	await validateDBConnection();
	const port = env.PORT;

	const server = require('../../server').default;

	await emitter.emitAsync('server.start.before', { server });

	server
		.listen(port, () => {
			logger.info(`Server started at port ${port}`);
			emitter.emitAsync('server.start').catch((err) => logger.warn(err));
		})
		.once('error', (err: any) => {
			if (err?.code === 'EADDRINUSE') {
				logger.fatal(`Port ${port} is already in use`);
				process.exit(1);
			} else {
				throw err;
			}
		});
}
