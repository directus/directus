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

/** Credentials of the superuser used to create and drop sandbox users and databases */
export type AdminEnv = Env & { DB_PASSWORD: string; DB_DATABASE: string };

/**
 * Manages users, databases and templates inside of a long lived database container.
 * Implements the default behavior, which each vendor can override.
 */
export abstract class SharedHelper {
	/** Port the database listens on inside of its container */
	abstract readonly port: number;
	/** Whether sandboxes are cloned from a bootstrapped template, otherwise each sandbox is bootstrapped on its own */
	readonly supportsTemplates: boolean = true;
	/** Folder inside of the container where template snapshots are stored */
	protected readonly templateFolder: string = '/tmp';

	container!: string;
	admin!: AdminEnv;

	constructor(
		readonly database: SharedVendor,
		readonly project: string,
		protected env: Env,
		protected logger: Logger,
	) {}

	/** Start the shared container unless it is already running and healthy */
	async start() {
		let container = await findContainer(this.project, this.database);

		if (container && (await isHealthy(container))) {
			this.logger.info(`Reusing shared database container ${this.project}`);
		} else {
			this.logger.info(`Starting shared database container ${this.project}`);

			// Keep the port of an existing but unhealthy container so compose doesn't recreate it
			const ports = container ? { DB_PORT: await getHostPort(container, this.port) } : {};

			await composeUp(this.project, [this.database], { ...this.env, ...ports }, this.logger);

			container = await findContainer(this.project, this.database);
			if (!container) throw new Error(`Shared database container ${this.project} could not be found after starting it`);
		}

		this.container = container;
		Object.assign(this.env, await this.getPorts());
		this.admin = { ...this.env } as AdminEnv;
	}

	/** Host ports of the container, these are fixed by whoever started the container first */
	protected async getPorts(): Promise<Record<string, string>> {
		return { DB_PORT: await getHostPort(this.container, this.port) };
	}

	/** Name of the database a sandbox user connects to */
	databaseName(user: string) {
		return user;
	}

	generatePassword() {
		// Satisfies the mssql password policy while staying a valid unquoted identifier for oracle
		return `Sb1_${randomBytes(12).toString('hex')}`;
	}

	/** Create the sandbox user, granting the same privileges the default (non shared) setup has, so tests behave the same */
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

	/**
	 * Bootstrap a fresh database and store it as the template that sandboxes are cloned from.
	 * Templates of other keys are removed, as they are outdated.
	 */
	async buildTemplate(template: string, opts: Options) {
		const start = performance.now();
		this.logger.info(`Building shared database template ${template}`);

		await this.removeTemplates();
		await this.drop(template, template);
		await this.query((knex) => this.createDatabase(knex, template));

		// Bootstrapped by the admin, so the template doesn't depend on any sandbox user
		await bootstrap(opts, { ...this.admin, DB_DATABASE: template } as Env, this.logger);
		await this.saveTemplate(template);

		const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);
		this.logger.info(`Built shared database template ${template} ${time}`);
	}

	/** Remove all templates, they are only ever built when the current one is missing or broken */
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

	/** Snapshot the bootstrapped template database into a file inside of the container */
	protected async saveTemplate(template: string) {
		await this.backup(template);

		// The snapshot is all that is needed from now on, the marker makes sure only complete snapshots are used
		await this.drop(template, template);
		await exec('docker', ['exec', this.container, 'touch', this.templateFile(template, 'ready')]);
	}

	protected async backup(_template: string): Promise<void> {
		throw new Error(`Templates are not supported for ${this.database}`);
	}

	/** Create the sandbox database and user from the template */
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

	/** Run queries as the admin */
	protected async query<T>(fn: (knex: Knex) => Promise<T>) {
		// Connection setup is logged on every connect, which is just noise here
		const logger = { ...this.logger, info() {}, debug() {} };
		const knex = createDatabase(this.admin, logger);

		try {
			return await fn(knex);
		} finally {
			await knex.destroy();
		}
	}
}
