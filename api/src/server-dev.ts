import server from './server';
import logger from './logger';

server.listen(8055, () => logger.info(`Dev server started at port ${8055}`));
