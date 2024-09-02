export default function registerHooks({ action }) {
	const logsCollection = 'tests_extensions_log';

	action('collections.create', collectionsCallback);
	action('collections.update', collectionsCallback);
	action('collections.delete', collectionsCallback);
	action('fields.create', fieldsCallback);
	action('fields.update', fieldsCallback);
	action('fields.delete', fieldsCallback);

	async function collectionsCallback(data, { database, schema }) {
		let key = 'action-verify-schema';

		switch (data.event) {
			case 'collections.create':
				if (!data.key.startsWith('test_collections_crud')) break;
				if (data.key.includes('folder')) break;

				key += `/${data.key}/${data.event}`;

				if (schema.collections[data.key]) {
					await database(logsCollection).insert({ key, value: '1' });
				} else {
					await database(logsCollection).insert({ key, value: '0' });
				}

				break;
			case 'collections.update':
				if (!data.keys[0].startsWith('test_collections_crud')) break;

				key += `/${data.keys[0]}/${data.event}`;

				if (data.payload.note === schema.collections[data.keys[0]].note) {
					await database(logsCollection).insert({ key, value: '1' });
				} else {
					await database(logsCollection).insert({ key, value: '0' });
				}

				break;
			case 'collections.delete':
				if (!data.payload[0].startsWith('test_collections_crud')) break;

				key += `/${data.payload[0]}/${data.event}`;

				if (!schema.collections[data.collection].fields[data.payload[0]]) {
					await database(logsCollection).insert({ key, value: '1' });
				} else {
					await database(logsCollection).insert({ key, value: '0' });
				}

				break;
		}
	}

	async function fieldsCallback(data, { database, schema }) {
		const logConnection = 'tests_extensions_log';
		let key = 'action-verify-schema';

		if (data.collection.startsWith('test_fields_crud')) {
			switch (data.event) {
				case 'fields.create':
					if (data.key !== 'test_field') break;

					key += `/${data.collection}/${data.event}/${data.key}`;

					if (schema.collections[data.payload.collection].fields[data.payload.field]) {
						await database(logConnection).insert({ key, value: '1' });
					} else {
						await database(logConnection).insert({ key, value: '0' });
					}

					break;
				case 'fields.update':
					if (data.keys[0] !== 'test_field') break;

					key += `/${data.collection}/${data.event}/${data.keys[0]}`;

					if (data.payload.meta.note === schema.collections[data.collection].fields[data.keys[0]].note) {
						await database(logConnection).insert({ key, value: '1' });
					} else {
						await database(logConnection).insert({ key, value: '0' });
					}

					break;
				case 'fields.delete':
					if (data.payload[0] !== 'test_field') break;

					key += `/${data.collection}/${data.event}/${data.payload[0]}`;

					if (!schema.collections[data.collection].fields[data.payload[0]]) {
						await database(logConnection).insert({ key, value: '1' });
					} else {
						await database(logConnection).insert({ key, value: '0' });
					}

					break;
			}
		}
	}
}
