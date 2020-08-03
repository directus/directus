import logger from '../../logger';
import dotenv from 'dotenv';

export default async function start() {
	dotenv.config();

	const app = require('../../app').default;

	const port = process.env.PORT;

	app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});
}
