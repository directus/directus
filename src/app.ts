import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';

import { errorHandler } from './error';

import activityRouter from './routes/activity';
import collectionPresetsRouter from './routes/collection-presets';
import extensionsRouter from './routes/extensions';
import filesRouter from './routes/files';
import foldersRouter from './routes/folders';
import itemsRouter from './routes/items';
import permissionsRouter from './routes/permissions';
import relationsRouter from './routes/relations';
import revisionsRouter from './routes/revisions';
import rolesRouter from './routes/roles';
import usersRouter from './routes/users';

import notFoundHandler from './routes/not-found';

const app = express()
	.disable('x-powered-by')
	.use(bodyParser.json())
	.use('/activity', activityRouter)
	.use('/collection_presets', collectionPresetsRouter)
	.use('/extensions', extensionsRouter)
	.use('/files', filesRouter)
	.use('/folders', foldersRouter)
	.use('/items', itemsRouter)
	.use('/permissions', permissionsRouter)
	.use('/relations', relationsRouter)
	.use('/revisions', revisionsRouter)
	.use('/roles', rolesRouter)
	.use('/users', usersRouter)
	.use(notFoundHandler)
	.use(errorHandler);

export default app;
