import { randomBytes, randomUUIDv7 } from 'crypto';
import chalk from 'chalk';
import { type Env } from '../../config.js';
import { type Logger } from '../../logger.js';
import type { Database, Options } from '../../sandbox.js';
import { bootstrap } from '../api.js';
import { createDatabase } from '../database.js';
import * as helpers from './dialects/index.js';
import type { SharedHelper } from './types.js';
import { getTemplateKey, withLock } from './utils.js';

export type SharedDatabase = {
	helper: SharedHelper;
	user: string;
	name: string;
};

/**
 * Create a fresh user and database in a long lived container, cloned from a bootstrapped template.
 * Updates `env` in place.
 */
export async function createSharedDatabase(
	database: Database,
	opts: Options,
	env: Env,
	logger: Logger,
): Promise<SharedDatabase | undefined> {
	if (database === 'sqlite' || !('DB_PORT' in env)) return;

	const start = performance.now();
	const project = `sandbox_shared_${database}_${env.DB_VERSION}`.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
	const helper = new helpers[database](database, project, env, logger);
	const template = `sandbox_template_${await getTemplateKey(opts, env)}`;
	const user = `sandbox_${randomBytes(6).toString('hex')}`;
	const password = helper.generatePassword();

	const name = await withLock(project, async () => {
		await helper.start();
		const name = helper.databaseName(user);

		// Outside the lock so parallel sandboxes don't wait on each other
		if (!helper.supportsTemplates) return name;

		if (!(await helper.hasTemplate(template))) await helper.buildTemplate(template, opts);

		try {
			await helper.cloneTemplate(template, user, password, name);
		} catch (err) {
			// The template might be broken from an interrupted build, rebuild once
			logger.warn(`Cloning template ${template} failed, rebuilding it: ${err}`);
			await helper.drop(user, name).catch(() => {});
			await helper.buildTemplate(template, opts);

			try {
				await helper.cloneTemplate(template, user, password, name);
			} catch (err) {
				await helper.drop(user, name).catch(() => {});
				throw err;
			}
		}

		return name;
	});

	Object.assign(env, { DB_USER: user, DB_PASSWORD: password, DB_DATABASE: name });

	if (helper.supportsTemplates) {
		// Each installation needs its own project id
		const knex = createDatabase(env, logger);

		try {
			await knex('directus_settings').update({ project_id: randomUUIDv7() });
		} finally {
			await knex.destroy();
		}
	} else {
		try {
			await helper.createUser(user, password, name);
			await bootstrap(opts, env, logger);
		} catch (err) {
			await helper.drop(user, name).catch(() => {});
			throw err;
		}
	}

	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);
	logger.info(`Shared database created at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE} ${time}`);
	logger.info(`User: ${chalk.cyan(env.DB_USER)} Password: ${chalk.cyan(env.DB_PASSWORD)}`);

	return { helper, user, name };
}

export async function dropSharedDatabase({ helper, user, name }: SharedDatabase, logger: Logger) {
	const start = performance.now();
	await helper.drop(user, name);
	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);
	logger.info(`Dropped shared database ${user} ${time}`);
}
