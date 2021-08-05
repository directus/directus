import { Knex } from 'knex';
import getDatabase from '../database';
import { AbstractServiceOptions, SchemaOverview } from '../types';
import { Accountability } from '@directus/shared/types';
import { ItemsService } from './items';

export class OrganismsUsersService extends ItemsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	service: ItemsService;

	constructor(options: AbstractServiceOptions) {
		super('directus_organisms_users', options);

		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.service = new ItemsService('directus_organisms_users', options);
		this.schema = options.schema;
	}
}
