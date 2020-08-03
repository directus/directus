import app from './app';
import logger from './logger';

const port = process.env.NODE_ENV === 'development' ? 41201 : process.env.PORT;

app.listen(port, () => {
	logger.info(`Server started at port ${port}`);
});
