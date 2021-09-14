import cookieParser from 'cookie-parser';
import express, { RequestHandler } from 'express';
import fse from 'fs-extra';
import path from 'path';
import qs from 'qs';

import activityRouter from './controllers/activity';
import assetsRouter from './controllers/assets';
import authRouter from './controllers/auth';
import collectionsRouter from './controllers/collections';
import dashboardsRouter from './controllers/dashboards';
import extensionsRouter from './controllers/extensions';
import fieldsRouter from './controllers/fields';
import filesRouter from './controllers/files';
import foldersRouter from './controllers/folders';
import graphqlRouter from './controllers/graphql';
import itemsRouter from './controllers/items';
import notFoundHandler from './controllers/not-found';
import panelsRouter from './controllers/panels';
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
import { isInstalled, validateDatabaseConnection, validateDatabaseExtensions, validateMigrations } from './database';
import emitter from './emitter';
import env from './env';
import { InvalidPayloadException } from './exceptions';
import { getExtensionManager } from './extensions';
import logger, { expressLogger } from './logger';
import authenticate from './middleware/authenticate';
import cache from './middleware/cache';
import { checkIP } from './middleware/check-ip';
import cors from './middleware/cors';
import errorHandler from './middleware/error-handler';
import extractToken from './middleware/extract-token';
import rateLimiter from './middleware/rate-limiter';
import sanitizeQuery from './middleware/sanitize-query';
import schema from './middleware/schema';

import { track } from './utils/track';
import { validateEnv } from './utils/validate-env';
import { validateStorage } from './utils/validate-storage';
import { register as registerWebhooks } from './webhooks';
import { session } from './middleware/session';
import { flushCaches } from './cache';
import { Url } from './utils/url';

export default async function createApp(): Promise<express.Application> {
	validateEnv(['KEY', 'SECRET']);

	if (!new Url(env.PUBLIC_URL).isAbsolute()) {
		logger.warn('PUBLIC_URL should be a full URL');
	}

	await validateStorage();

	await validateDatabaseConnection();
	await validateDatabaseExtensions();

	if ((await isInstalled()) === false) {
		logger.error(`Database doesn't have Directus tables installed.`);
		process.exit(1);
	}

	if ((await validateMigrations()) === false) {
		logger.warn(`Database migrations have not all been run`);
	}

	await flushCaches();

	const extensionManager = getExtensionManager();

	await extensionManager.initialize();

	const app = express();

	app.disable('x-powered-by');
	app.set('trust proxy', true);
	app.set('query parser', (str: string) => qs.parse(str, { depth: 10 }));

	await emitter.emitInit('app.before', { app });

	await emitter.emitInit('middlewares.before', { app });

	app.use(expressLogger);

	app.use((req, res, next) => {
		(
			express.json({
				limit: env.MAX_PAYLOAD_SIZE,
			}) as RequestHandler
		)(req, res, (err: any) => {
			if (err) {
				return next(new InvalidPayloadException(err.message));
			}

			return next();
		});
	});

	app.use(cookieParser());

	app.use(extractToken);

	app.use((req, res, next) => {
		res.setHeader('X-Powered-By', 'Directus');
		next();
	});

	if (env.CORS_ENABLED === true) {
		app.use(cors);
	}

	app.get('/', (req, res, next) => {
		if (env.ROOT_REDIRECT) {
			res.redirect(env.ROOT_REDIRECT);
		} else {
			next();
		}
	});

	if (env.SERVE_APP) {
		const adminPath = require.resolve('@directus/app/dist/index.html');
		const adminUrl = new Url(env.PUBLIC_URL).addPath('admin');

		// Set the App's base path according to the APIs public URL
		let html = fse.readFileSync(adminPath, 'utf-8');
		html = html.replace(
			/<meta charset="utf-8" \/>/,
			`<meta charset="utf-8" />\n\t\t<base href="${adminUrl.toString({ rootRelative: true })}/">`
		);

		app.get('/admin', (req, res) => res.send(html));
		app.use('/admin', express.static(path.join(adminPath, '..')));
		app.use('/admin/*', (req, res) => {
			res.send(html);
		});
	}

	// use the rate limiter - all routes for now
	if (env.RATE_LIMITER_ENABLED === true) {
		app.use(rateLimiter);
	}

	// We only rely on cookie-sessions in the oAuth flow where it's required
	app.use(session);

	app.use(authenticate);

	app.use(checkIP);

	app.use(sanitizeQuery);

	await emitter.emitInit('middlewares.after', { app });

	await emitter.emitInit('routes.before', { app });

	app.use(cache);

	app.use(schema);

	app.use('/auth', authRouter);

	app.use('/graphql', graphqlRouter);

	app.use('/activity', activityRouter);
	app.use('/assets', assetsRouter);
	app.use('/collections', collectionsRouter);
	app.use('/dashboards', dashboardsRouter);
	app.use('/extensions', extensionsRouter);
	app.use('/fields', fieldsRouter);
	app.use('/files', filesRouter);
	app.use('/folders', foldersRouter);
	app.use('/items', itemsRouter);
	app.use('/panels', panelsRouter);
	app.use('/permissions', permissionsRouter);
	app.use('/presets', presetsRouter);
	app.use('/relations', relationsRouter);
	app.use('/revisions', revisionsRouter);
	app.use('/roles', rolesRouter);
	app.use('/server', serverRouter);
	app.use('/settings', settingsRouter);
	app.use('/users', usersRouter);
	app.use('/utils', utilsRouter);
	app.use('/webhooks', webhooksRouter);

	// Register custom endpoints
	await emitter.emitInit('routes.custom.before', { app });
	app.use(extensionManager.getEndpointRouter());
	await emitter.emitInit('routes.custom.after', { app });

	app.use(notFoundHandler);
	app.use(errorHandler);

	await emitter.emitInit('routes.after', { app });

	// Register all webhooks
	await registerWebhooks();

	track('serverStarted');

	await emitter.emitInit('app.after', { app });

	return app;
}
