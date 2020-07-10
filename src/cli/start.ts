import app from '../app';
import logger from '../logger';
import getPort from 'get-port';
import clear from 'clear';

export default async function start() {
	clear();

	const port = process.env.PORT || (await getPort({ port: 3000 }));

	app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});
}
