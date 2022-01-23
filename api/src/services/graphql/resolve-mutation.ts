import { Accountability, Item, Query, SchemaOverview } from '@directus/shared/types';
import { Knex } from 'knex';
import { formatGQLError } from './shared/format-gql-error';
import { getService } from './shared/get-service';

export class ResolveMutation {
	schema: SchemaOverview;
	knex: Knex;
	accountability: Accountability | null;

	constructor(options: { knex: Knex; accountability: Accountability | null; schema: SchemaOverview }) {
		this.knex = options.knex;
		this.accountability = options.accountability;
		this.schema = options.schema;
	}

	/**
	 * Upsert and read singleton item
	 */
	async upsertSingleton(
		collection: string,
		body: Record<string, any> | Record<string, any>[],
		query: Query
	): Promise<Partial<Item> | boolean> {
		const service = getService(
			{ knex: this.knex, accountability: this.accountability, schema: this.schema },
			collection
		);

		try {
			await service.upsertSingleton(body);

			if ((query.fields || []).length > 0) {
				const result = await service.readSingleton(query);
				return result;
			}

			return true;
		} catch (err: any) {
			throw formatGQLError(err);
		}
	}
}
