import { AbstractServiceOptions, Accountability, SchemaOverview } from '../types';
import Knex from 'knex';
import database from '../database';
import os from 'os';
// @ts-ignore
import { version } from '../../package.json';
import macosRelease from 'macos-release';
import { SettingsService } from './settings';

export class ServerService {
	knex: Knex;
	accountability: Accountability | null;
	settingsService: SettingsService;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || database;
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.settingsService = new SettingsService({ knex: this.knex, schema: this.schema });
	}

	async serverInfo() {
		const info: Record<string, any> = {};

		const projectInfo = await this.settingsService.readSingleton({
			fields: [
				'project_name',
				'project_logo',
				'project_color',
				'public_foreground',
				'public_background',
				'public_note',
				'custom_css',
			],
		});

		info.project = projectInfo;

		if (this.accountability?.admin === true) {
			const osType = os.type() === 'Darwin' ? 'macOS' : os.type();

			const osVersion =
				osType === 'macOS'
					? `${macosRelease().name} (${macosRelease().version})`
					: os.release();

			info.directus = {
				version,
			};
			info.node = {
				version: process.versions.node,
				uptime: Math.round(process.uptime()),
			};
			info.os = {
				type: osType,
				version: osVersion,
				uptime: Math.round(os.uptime()),
				totalmem: os.totalmem(),
			};
		}

		return info;
	}
}
