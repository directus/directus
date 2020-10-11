import { AbstractServiceOptions, Accountability } from '../types';
import Knex from 'knex';
import database from '../database';
import os from 'os';
import { ForbiddenException } from '../exceptions';
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

	serverInfo() {
		if (this.accountability?.admin !== true) {
			throw new ForbiddenException();
		}

		const osType = os.type() === 'Darwin' ? 'macOS' : os.type();
		const osVersion =
			osType === 'macOS'
				? `${macosRelease().name} (${macosRelease().version})`
				: os.release();

		return {
			directus: {
				version,
			},
			node: {
				version: process.versions.node,
				uptime: Math.round(process.uptime()),
			},
			os: {
				type: osType,
				version: osVersion,
				uptime: Math.round(os.uptime()),
				totalmem: os.totalmem(),
			},
		};
	}
}
