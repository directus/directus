import logger from '../../logger';
import getPort from 'get-port';
import clear from 'clear';
import dotenv from 'dotenv';

export default async function start() {
	dotenv.config();
	const app = require('../../app');

	clear();

	const port = process.env.PORT || (await getPort({ port: 3000 }));

	app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});
}
