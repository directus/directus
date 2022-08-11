import { Accountability, PermissionsAction, Query, SchemaOverview, Item, PrimaryKey } from '@directus/shared/types';
import { Knex } from 'knex';
import { ForbiddenException } from '../exceptions';
import { ItemsService } from '../services/items';

export async function getItemsContext(
	context: {
		accountability: null | Accountability;
		schema: SchemaOverview;
		knex: Knex;
	},
	action: PermissionsAction,
	collection: string,
	pk: PrimaryKey | PrimaryKey[],
	fields: string[] = ['*']
): Promise<Array<Item>> {
	const itemsService = new ItemsService(collection, context);

	if (!Array.isArray(pk)) {
		pk = [pk];
	}

	const query: Query = {
		fields,
		limit: pk.length,
	};

	const result = await itemsService.readMany(pk, query, { permissionsAction: action });
	if (result?.length !== pk.length) throw new ForbiddenException();

	return result;
}
