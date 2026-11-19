import { randomBytes } from 'crypto';
import chalk from 'chalk';
import type { Knex } from 'knex';
import { type Env } from '../../config.js';
import { type Logger } from '../../logger.js';
import type { Database, Options } from '../../sandbox.js';
import { bootstrap } from '../api.js';
import { createDatabase } from '../database.js';
import { composeUp } from '../docker.js';
import { exec, findContainer, getHostPort, isHealthy } from './utils.js';

export type SharedVendor = Exclude<Database, 'sqlite'>;

/** Superuser credentials for managing sandbox users and databases */
export type AdminEnv = Env & { DB_PASSWORD: string; DB_DATABASE: string };

/**
 * Manages users, databases and templates in a long lived container. Vendors override as needed.
 */
export abstract class SharedHelper {
	abstract readonly port: number;
	/** Clone from a template instead of bootstrapping each sandbox */
	readonly supportsTemplates: boolean = true;
	protected readonly templateFolder: string = '/tmp';

	container!: string;
	admin!: AdminEnv;

	constructor(
		readonly database: SharedVendor,
		readonly project: string,
		protected env: Env,
		protected logger: Logger,
	) {}

	async start() {
		let container = await findContainer(this.project, this.database);

		if (container && (await isHealthy(container))) {
			this.logger.info(`Reusing shared database container ${this.project}`);
		} else {
			this.logger.info(`Starting shared database container ${this.project}`);

			// Keep existing ports, compose recreates the container on any change
			if (container) {
				this.container = container;
				Object.assign(this.env, await this.getPorts());
			}

			await composeUp(this.project, [this.database], this.env, this.logger);

			container = await findContainer(this.project, this.database);
			if (!container) throw new Error(`Shared database container ${this.project} could not be found after starting it`);
		}

		this.container = container;
		Object.assign(this.env, await this.getPorts());
		this.admin = { ...this.env } as AdminEnv;
	}

	/** Host ports, fixed by whoever started the container first */
	protected async getPorts(): Promise<Record<string, string>> {
		return { DB_PORT: await getHostPort(this.container, this.port) };
	}

	databaseName(user: string) {
		return user;
	}

	generatePassword() {
		// Meets the mssql password policy and is a valid oracle identifier
		return `Sb1_${randomBytes(12).toString('hex')}`;
	}

	/** Create the sandbox user with the same privileges as the non shared setup */
	abstract createUser(user: string, password: string, name: string): Promise<void>;

	async drop(user: string, name: string) {
		await this.query(async (knex) => {
			await this.dropDatabase(knex, name);
			await this.dropUser(knex, user);
		});
	}

	protected async createDatabase(knex: Knex, name: string) {
		await knex.raw(`CREATE DATABASE "${name}"`);
	}

	protected async dropDatabase(knex: Knex, name: string) {
		await knex.raw(`DROP DATABASE IF EXISTS "${name}"`);
	}

	protected async dropUser(knex: Knex, user: string) {
		await knex.raw(`DROP USER IF EXISTS "${user}"`);
	}

	async hasTemplate(template: string) {
		return exec('docker', ['exec', this.container, 'test', '-f', this.templateFile(template, 'ready')]).then(
			() => true,
			() => false,
		);
	}

	/** Bootstrap and store the template sandboxes are cloned from, removing outdated templates. */
	async buildTemplate(template: string, opts: Options) {
		const start = performance.now();
		this.logger.info(`Building shared database template ${template}`);

		await this.removeTemplates();
		await this.drop(template, template);
		await this.query((knex) => this.createDatabase(knex, template));

		// Bootstrapped as admin so the template doesn't depend on a sandbox user
		await bootstrap(opts, { ...this.admin, DB_DATABASE: template } as Env, this.logger);
		await this.saveTemplate(template);

		const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);
		this.logger.info(`Built shared database template ${template} ${time}`);
	}

	async removeTemplates() {
		const folder = this.templateFolder;

		await exec('docker', [
			'exec',
			this.container,
			'sh',
			'-c',
			`mkdir -p ${folder} && rm -rf ${folder}/sandbox_template_*`,
		]);
	}

	protected async saveTemplate(template: string) {
		await this.backup(template);

		// The marker ensures only complete snapshots are used
		await this.drop(template, template);
		await exec('docker', ['exec', this.container, 'touch', this.templateFile(template, 'ready')]);
	}

	protected async backup(_template: string): Promise<void> {
		throw new Error(`Templates are not supported for ${this.database}`);
	}

	async cloneTemplate(template: string, user: string, password: string, name: string) {
		await this.restore(template, name);
		await this.createUser(user, password, name);
	}

	protected async restore(_template: string, _name: string): Promise<void> {
		throw new Error(`Templates are not supported for ${this.database}`);
	}

	protected templateFile(template: string, extension: string) {
		return `${this.templateFolder}/${template}.${extension}`;
	}

	protected async query<T>(fn: (knex: Knex) => Promise<T>) {
		const logger = { ...this.logger, info() {}, debug() {} };
		const knex = createDatabase(this.admin, logger);

		try {
			return await fn(knex);
		} finally {
			await knex.destroy();
		}
	}
}
