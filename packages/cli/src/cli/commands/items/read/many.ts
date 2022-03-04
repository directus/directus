import { command } from '../../../../core/command';

export default command(
	{
		group: 'items',
		parameters: '<collection>',
		description: 'Reads many items in a collection',
		usage: `
			**Simple read**

			\`\`\`
			$ $0 items read many <collection>
			\`\`\`

			**Read only first 5 matching items**

			\`\`\`
			$ $0 items read many <collection> --limit 5
			\`\`\`
		`,
		documentation: `
			Reads a set of items from a collection.
		`,
		features: {
			sdk: true,
			query: 'many',
		},
		hints: ['all', 'get all', 'get many', 'ls', 'list', 'read many', 'many'],
		options: function (builder) {
			return builder.positional('collection', {
				type: 'string',
				description: "The collection's name",
				demandOption: true,
			});
		},
	},
	async function ({ output, query, sdk }, params) {
		const item = await sdk.items(params.collection).readByQuery(query.many);
		if (item.data && !Array.isArray(item.data)) {
			item.data = [item.data];
		}

		await output.compose(async (ui) => {
			await ui.wrap((ui) => ui.header('Items'), 1);
			await ui.json(item.data);
			if (item.meta) {
				await ui.wrap((ui) => ui.header('Metadata'), 1);
				await ui.json(item.meta);
			}
		});

		if (item.meta) {
			return item;
		}

		return item.data;
	}
);
