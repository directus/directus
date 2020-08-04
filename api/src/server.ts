import app from './app';
import logger from './logger';
import env from './env';

const port = env.NODE_ENV === 'development' ? 41201 : env.PORT;

app.listen(port, () => {
	logger.info(`Server started at port ${port}`);
});
