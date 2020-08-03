import app from './app';
import logger from './logger';
import getPort from 'get-port';

(async () => {
	const port = process.env.PORT || (await getPort({ port: 41201 }));

	app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});
})();
