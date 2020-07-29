import logger from '../../logger';
import getPort from 'get-port';
import dotenv from 'dotenv';

export default async function start() {
	dotenv.config();
	const app = require('../../app').default;

	const port = process.env.PORT || (await getPort({ port: 3000 }));

	app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});
}
