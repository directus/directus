import logger from '../../logger';

export default async function start() {
	const { default: env, validateEnv } = require('../../env');
	const { validateDBConnection } = require('../../database');

	validateEnv();
	await validateDBConnection();

	const app = require('../../app').default;

	const port = env.PORT;

	app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});
}
