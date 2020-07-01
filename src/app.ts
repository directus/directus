import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import logger from 'express-pino-logger';

import errorHandler from './middleware/error-handler';

import extractToken from './middleware/extract-token';
import authenticate from './middleware/authenticate';

import activityRouter from './routes/activity';
import assetsRouter from './routes/assets';
import authRouter from './routes/auth';
import collectionsRouter from './routes/collections';
import collectionPresetsRouter from './routes/collection-presets';
import extensionsRouter from './routes/extensions';
import fieldsRouter from './routes/fields';
import filesRouter from './routes/files';
import foldersRouter from './routes/folders';
import itemsRouter from './routes/items';
import permissionsRouter from './routes/permissions';
import relationsRouter from './routes/relations';
import revisionsRouter from './routes/revisions';
import rolesRouter from './routes/roles';
import serverRouter from './routes/server';
import settingsRouter from './routes/settings';
import usersRouter from './routes/users';
import webhooksRouter from './routes/webhooks';

import notFoundHandler from './routes/not-found';

const app = express()
	.disable('x-powered-by')
	.set('trust proxy', true)
	.use(logger())
	.use(bodyParser.json())
	.use(extractToken)
	.use(authenticate)
	.use('/activity', activityRouter)
	.use('/assets', assetsRouter)
	.use('/auth', authRouter)
	.use('/collections', collectionsRouter)
	.use('/collection_presets', collectionPresetsRouter)
	.use('/extensions', extensionsRouter)
	.use('/fields', fieldsRouter)
	.use('/files', filesRouter)
	.use('/folders', foldersRouter)
	.use('/items', itemsRouter)
	.use('/permissions', permissionsRouter)
	.use('/relations', relationsRouter)
	.use('/revisions', revisionsRouter)
	.use('/roles', rolesRouter)
	.use('/server/', serverRouter)
	.use('/settings', settingsRouter)
	.use('/users', usersRouter)
	.use('/webhooks', webhooksRouter)
	.use(notFoundHandler)
	.use(errorHandler);

export default app;
