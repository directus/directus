import { address } from 'faker';
import { Knex } from 'knex';

export const createItemSchema = async (database: Knex<any, unknown>, table: string) => {
	await database.schema.createTableIfNotExists('address', (table) => {
		table.uuid('id').primary();
		table.string('StreetName');
		table.integer('zipCode');
		table.string('country');
	});
};

export const seedItemSchema = async (database: Knex<any, unknown>, table: string, quantity: number): Promise<void> => {
	let i = 0;
	while (i < quantity) {
		await database(table).insert({
			streetName: address.streetName,
			city: address.city,
			zipcode: address.zipCode,
			country: address.country,
		});
		i++;
	}
};
