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

import activityRouter from './routes/activity';
import assetsRouter from './routes/assets';
import authRouter from './routes/auth';
import collectionsRouter from './routes/collections';
import extensionsRouter from './routes/extensions';
import fieldsRouter from './routes/fields';
import filesRouter from './routes/files';
import foldersRouter from './routes/folders';
import itemsRouter from './routes/items';
import permissionsRouter from './routes/permissions';
import presetsRouter from './routes/presets';
import relationsRouter from './routes/relations';
import revisionsRouter from './routes/revisions';
import rolesRouter from './routes/roles';
import serverRouter from './routes/server';
import settingsRouter from './routes/settings';
import usersRouter from './routes/users';
import utilsRouter from './routes/utils';
import webhooksRouter from './routes/webhooks';

import notFoundHandler from './routes/not-found';

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

	.use(authenticate)

	.use('/activity', activityRouter)
	.use('/assets', assetsRouter)
	.use('/collections', collectionsRouter)
	.use('/extensions', extensionsRouter)
	.use('/fields', fieldsRouter)
	.use('/files', filesRouter)
	.use('/folders', foldersRouter)
	.use('/items', itemsRouter)
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
