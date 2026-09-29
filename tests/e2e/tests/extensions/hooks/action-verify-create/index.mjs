/**
 * Verifies that an item is already readable from within the `items.create` action hook,
 * i.e. that the creating transaction has committed before the hook runs.
 *
 * Reports each item it saw on stdout as `action-verify-create:<collection>:<name>:<0|1>`.
 */
export default function registerHooks({ action }, { services }) {
	action('hook_artists.items.create', async (data, { schema, accountability }) => {
		const itemsService = new services.ItemsService(data.collection, { schema, accountability });

		let verified = '0';

		try {
			const item = await itemsService.readOne(data.key);
			if (item.name === data.payload.name) verified = '1';
		} catch {
			verified = '0';
		}

		// eslint-disable-next-line no-console
		console.log(`action-verify-create:${data.collection}:${data.payload.name}:${verified}`);
	});
}
