import { Accountability, Item, Query, SchemaOverview } from '@directus/shared/types';
import { Knex } from 'knex';
import { getService } from './shared/get-service';

export class Resolvers {
	schema: SchemaOverview;
	knex: Knex<any, unknown[]> | undefined;
	accountability: Accountability | null;

	constructor(options: { knex: Knex; accountabilty: Accountability | null; schema: SchemaOverview }) {
		(this.knex = options.knex), (this.accountability = options.accountabilty);
		this.schema = options.schema;
	}

	/**
	 * Execute the read action on the correct service. Checks for singleton as well.
	 */
	async read(collection: string, query: Query): Promise<Partial<Item>> {
		const service = getService(
			{ knex: this.knex, accountability: this.accountability, schema: this.schema },
			collection
		);

		const result = this.schema.collections[collection].singleton
			? await service.readSingleton(query, { stripNonRequested: false })
			: await service.readByQuery(query, { stripNonRequested: false });

		return result;
	}
}
