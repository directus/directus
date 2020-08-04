import logger from '../../logger';

export default async function start() {
	const env = require('../../env').default;
	const app = require('../../app').default;

	const port = env.PORT;

	app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});
}
