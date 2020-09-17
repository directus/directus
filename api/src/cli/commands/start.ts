import logger from '../../logger';

export default async function start() {
	const { default: env } = require('../../env');
	const { validateDBConnection } = require('../../database');

	await validateDBConnection();

	const app = require('../../app').default;

	const port = env.PORT;

	app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});
}
