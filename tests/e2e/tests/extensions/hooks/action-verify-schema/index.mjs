/**
 * Verifies that the schema handed to a `collections.*` / `fields.*` action hook already
 * reflects the change that triggered it.
 *
 * Reports on stdout as `action-verify-schema:<event>:<target>:<0|1>`.
 */
export default function registerHooks({ action }) {
	const PREFIX = 'hook_schema';

	const report = (event, target, ok) => {
		// eslint-disable-next-line no-console
		console.log(`action-verify-schema:${event}:${target}:${ok ? '1' : '0'}`);
	};

	action('collections.create', (data, { schema }) => {
		if (!data.key.startsWith(PREFIX)) return;
		report(data.event, data.key, Boolean(schema.collections[data.key]));
	});

	action('collections.update', (data, { schema }) => {
		if (!data.keys[0].startsWith(PREFIX)) return;
		report(data.event, data.keys[0], data.payload.note === schema.collections[data.keys[0]].note);
	});

	action('collections.delete', (data, { schema }) => {
		if (!data.payload[0].startsWith(PREFIX)) return;
		report(data.event, data.payload[0], !schema.collections[data.payload[0]]);
	});

	action('fields.create', (data, { schema }) => {
		if (!data.collection.startsWith(PREFIX)) return;
		report(data.event, data.key, Boolean(schema.collections[data.collection].fields[data.key]));
	});

	action('fields.update', (data, { schema }) => {
		if (!data.collection.startsWith(PREFIX)) return;
		report(data.event, data.keys[0], data.payload.meta.note === schema.collections[data.collection].fields[data.keys[0]].note); // prettier-ignore
	});

	action('fields.delete', (data, { schema }) => {
		if (!data.collection.startsWith(PREFIX)) return;
		report(data.event, data.payload[0], !schema.collections[data.collection].fields[data.payload[0]]);
	});
}
