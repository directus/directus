export default async function count(collection: string): Promise<void> {
	const database = require('../../../database/index').default;

	if (!collection) {
		console.error('Collection is required');
		process.exit(1);
	}

	try {
		const records = await database(collection).count('*', { as: 'count' });
		const count = Number(records[0].count);

		console.log(count);
		database.destroy();
		process.exit(0);
	} catch (err) {
		console.error(err);
		database.destroy();
		process.exit(1);
	}
}
