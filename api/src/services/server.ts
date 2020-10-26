import { AbstractServiceOptions, Accountability } from '../types';
import Knex from 'knex';
import database from '../database';
import os from 'os';
// @ts-ignore
import { version } from '../../package.json';
import macosRelease from 'macos-release';

export class ServerService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
	}

	async serverInfo() {
		const info: Record<string, any> = {};

		const projectInfo = await this.knex
			.select(
				'project_name',
				'project_logo',
				'project_color',
				'public_foreground',
				'public_background',
				'public_note',
				'custom_css'
			)
			.from('directus_settings')
			.first();

		info.project = projectInfo
			? {
					name: projectInfo.project_name,
					logo: projectInfo.project_logo,
					color: projectInfo.project_color,
					foreground: projectInfo.public_foreground,
					background: projectInfo.public_background,
					note: projectInfo.public_note,
					customCSS: projectInfo.custom_css,
			  }
			: null;

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
