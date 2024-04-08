export default function registerHooks({ action }, { services }) {
	const logsCollection = 'tests_extensions_log';

	action('test_items_no_relations_artists_integer.items.create', collectionsCallback);
	action('test_items_no_relations_artists_string.items.create', collectionsCallback);
	action('test_items_no_relations_artists_uuid.items.create', collectionsCallback);

	async function collectionsCallback(data, { database, schema, accountability }) {
		let key = `action-verify-create/${data.collection}`;

		const itemService = new services.ItemsService(data.collection, { schema, accountability });

		if (!data.payload.name) return;

		if (data.payload.name.startsWith('one')) {
			key += '/one';
		} else if (data.payload.name.startsWith('many')) {
			key += '/many';
		} else {
			return;
		}

		key += `/${data.key}`;

		try {
			const item = await itemService.readOne(data.key);

			if (item.name !== data.payload.name) {
				throw 'Invalid item';
			}

			await database(logsCollection).insert({ key, value: '1' });
		} catch (err) {
			await database(logsCollection).insert({ key, value: '0' });
		}
	}
}
