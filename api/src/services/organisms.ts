import { Knex } from 'knex';
import getDatabase from '../database';
import { AbstractServiceOptions, Accountability, SchemaOverview } from '../types';
import { ItemsService } from './items';

export class OrganismsService extends ItemsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	service: ItemsService;

	constructor(options: AbstractServiceOptions) {
		super('directus_organisms', options);

		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.service = new ItemsService('directus_organisms', options);
		this.schema = options.schema;
	}
}
