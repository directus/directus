import app from './app';
import logger from './logger';
import env from './env';
import { validateDBConnection } from './database';

export default async function start() {
	await validateDBConnection();

	const port = env.NODE_ENV === 'development' ? 8805 : env.PORT;

	app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});
}

start();
