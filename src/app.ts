import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import { errorHandler } from './error';
import itemsRouter from './routes/items';
import activityRouter from './routes/activity';
import collectionPresetsRouter from './routes/collection-presets';
import filesRouter from './routes/files';
import foldersRouter from './routes/folders';
import relationsRouter from './routes/relations';
import revisionsRouter from './routes/revisions';
import rolesRouter from './routes/roles';
import usersRouter from './routes/users';
import extensionsRouter from './routes/extensions';
import notFoundHandler from './routes/not-found';

const app = express()
	.disable('x-powered-by')
	.use(bodyParser.json())
	.use('/items', itemsRouter)
	.use('/files', filesRouter)
	.use('/activity', activityRouter)
	.use('/collection_presets', collectionPresetsRouter)
	.use('/folders', foldersRouter)
	.use('/relations', relationsRouter)
	.use('/revisions', revisionsRouter)
	.use('/roles', rolesRouter)
	.use('/users', usersRouter)
	.use('/extensions', extensionsRouter)
	.use(notFoundHandler)
	.use(errorHandler);

export default app;
