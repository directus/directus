import express from 'express';
import bodyParser from 'body-parser';
import logger from './logger';
import expressLogger from 'express-pino-logger';
import path from 'path';
import cors from 'cors';
import env from './env';

import errorHandler from './middleware/error-handler';

import extractToken from './middleware/extract-token';
import authenticate from './middleware/authenticate';
import responseManager from './middleware/response-manager';

import activityRouter from './controllers/activity';
import assetsRouter from './controllers/assets';
import authRouter from './controllers/auth';
import collectionsRouter from './controllers/collections';
import extensionsRouter from './controllers/extensions';
import fieldsRouter from './controllers/fields';
import filesRouter from './controllers/files';
import foldersRouter from './controllers/folders';
import itemsRouter from './controllers/items';
import permissionsRouter from './controllers/permissions';
import presetsRouter from './controllers/presets';
import relationsRouter from './controllers/relations';
import revisionsRouter from './controllers/revisions';
import rolesRouter from './controllers/roles';
import serverRouter from './controllers/server';
import settingsRouter from './controllers/settings';
import usersRouter from './controllers/users';
import utilsRouter from './controllers/utils';
import webhooksRouter from './controllers/webhooks';

import notFoundHandler from './controllers/not-found';

const app = express().disable('x-powered-by').set('trust proxy', true);

app.use(expressLogger({ logger }))
	.use(bodyParser.json())
	.use(extractToken)
	.use((req, res, next) => {
		res.setHeader('X-Powered-By', 'Directus');
		next();
	});

if (env.CORS_ENABLED === 'true') {
	app.use(
		cors({
			origin: env.CORS_ORIGIN || true,
			methods: env.CORS_METHODS || 'GET,POST,PATCH,DELETE',
			allowedHeaders: env.CORS_ALLOWED_HEADERS,
			exposedHeaders: env.CORS_EXPOSED_HEADERS,
			credentials: env.CORS_CREDENTIALS === 'true' || undefined,
			maxAge: Number(env.CORS_MAX_AGE) || undefined,
		})
	);
}

if (env.NODE_ENV !== 'development') {
	const adminPath = require.resolve('@directus/app/dist/index.html');

	app.get('/', (req, res) => res.redirect('/admin/'))
		// the auth endpoints allow you to login/logout etc. It should ignore the authentication check
		.use('/admin', express.static(path.join(adminPath, '..')))
		.use('/admin/*', (req, res) => {
			res.sendFile(adminPath);
		});
}

app.use('/auth', authRouter)

	.use('/activity', activityRouter)
	.use('/assets', assetsRouter)
	.use('/collections', collectionsRouter, responseManager)
	.use('/extensions', extensionsRouter)
	.use('/fields', fieldsRouter)
	.use('/files', filesRouter)
	.use('/folders', foldersRouter)
	.use('/items', itemsRouter, responseManager)
	.use('/permissions', permissionsRouter)
	.use('/presets', presetsRouter)
	.use('/relations', relationsRouter)
	.use('/revisions', revisionsRouter)
	.use('/roles', rolesRouter)
	.use('/server/', serverRouter)
	.use('/settings', settingsRouter)
	.use('/users', usersRouter)
	.use('/utils', utilsRouter)
	.use('/webhooks', webhooksRouter);

app.use(notFoundHandler).use(errorHandler);

export default app;
