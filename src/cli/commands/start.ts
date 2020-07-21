import app from '../../app';
import logger from '../../logger';
import getPort from 'get-port';
import clear from 'clear';
import dotenv from 'dotenv';

dotenv.config();

export default async function start() {
	clear();

	const port = process.env.PORT || (await getPort({ port: 3000 }));

	app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});
}
