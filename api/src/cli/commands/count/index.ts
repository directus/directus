export default async function count(collection: string) {
	const database = require('../../../database/index').default;

	if (!collection) {
		console.error('Collection is required');
		process.exit(1);
	}

	const records = await database(collection).count('*', { as: 'count' });
	const count = Number(records[0].count);

	console.log(count);

	database.destroy();
}
