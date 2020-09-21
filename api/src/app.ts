import express from 'express';
import bodyParser from 'body-parser';
import logger from './logger';
import expressLogger from 'express-pino-logger';
import path from 'path';

import { validateEnv } from './utils/validate-env';
import env from './env';
import { track } from './utils/track';

import errorHandler from './middleware/error-handler';
import cors from './middleware/cors';
import rateLimiter from './middleware/rate-limiter';
import { respond } from './middleware/respond';
import cache from './middleware/cache';
import extractToken from './middleware/extract-token';
import authenticate from './middleware/authenticate';
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
import sanitizeQuery from './middleware/sanitize-query';
import WebhooksService from './services/webhooks';
import { InvalidPayloadException } from './exceptions';

validateEnv(['KEY', 'SECRET']);

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(expressLogger({ logger }));

app.use((req, res, next) => {
    bodyParser.json()(req, res, err => {
        if (err) {
			return next(new InvalidPayloadException(err.message));
        }

        return next();
    });
});

app.use(bodyParser.json());
app.use(extractToken);

app.use((req, res, next) => {
	res.setHeader('X-Powered-By', 'Directus');
	next();
});

if (env.CORS_ENABLED === true) {
	app.use(cors);
}

if (env.NODE_ENV !== 'development') {
	const adminPath = require.resolve('@directus/app/dist/index.html');

	app.get('/', (req, res) => res.redirect('/admin/'));
	app.use('/admin', express.static(path.join(adminPath, '..')));
	app.use('/admin/*', (req, res) => {
		res.sendFile(adminPath);
	});
}

// use the rate limiter - all routes for now
if (env.RATE_LIMITER_ENABLED === true) {
	app.use(rateLimiter);
}

app.use(sanitizeQuery);

app.use('/auth', authRouter, respond);

app.use(authenticate);
app.use(cache);

app.use('/activity', activityRouter, respond);
app.use('/assets', assetsRouter, respond);
app.use('/collections', collectionsRouter, respond);
app.use('/extensions', extensionsRouter, respond);
app.use('/fields', fieldsRouter, respond);
app.use('/files', filesRouter, respond);
app.use('/folders', foldersRouter, respond);
app.use('/items', itemsRouter, respond);
app.use('/permissions', permissionsRouter, respond);
app.use('/presets', presetsRouter, respond);
app.use('/relations', relationsRouter, respond);
app.use('/revisions', revisionsRouter, respond);
app.use('/roles', rolesRouter, respond);
app.use('/server/', serverRouter, respond);
app.use('/settings', settingsRouter, respond);
app.use('/users', usersRouter, respond);
app.use('/utils', utilsRouter, respond);
app.use('/webhooks', webhooksRouter, respond);
app.use(notFoundHandler);
app.use(errorHandler);

// Register all webhooks
const webhooksService = new WebhooksService();
webhooksService.register();

track('serverStarted');

export default app;
