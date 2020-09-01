import ItemsService from './items';
import { AbstractServiceOptions, Accountability } from '../types';
import Knex from 'knex';
import database from '../database';
import os from 'os';
import { ForbiddenException } from '../exceptions';
import { version } from '../../package.json';

export default class ServerService {
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

		return {
			directus: {
				version,
			},
			node: {
				version: process.versions.node,
				uptime: Math.round(process.uptime()),
			},
			os: {
				type: os.type(),
				version: os.release(),
				uptime: Math.round(os.uptime()),
				totalmen: os.totalmem(),
			}
		}
	}
}
