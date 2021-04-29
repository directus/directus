import { command } from '../../../../core/command';

export default command(
	{
		group: 'items',
		parameters: '<collection>',
		description: 'Reads one item in a collection',
		usage: `
			\`\`\`
			$ $0 items read one <collection>
			\`\`\`
		`,
		documentation: `
			Reads an existing item by it's primary key.
		`,
		features: {
			sdk: true,
			query: 'one',
		},
		options: function (builder) {
			return builder
				.option('id', {
					type: 'string',
					description: "The item's primary key id",
					demandOption: true,
				})
				.positional('collection', {
					type: 'string',
					description: "The collection's name",
					demandOption: true,
				});
		},
	},
	async function ({ output, query, sdk }, params) {
		const item = await sdk.items(params.collection).readOne(params.id, query.one);
		await output.compose(async (ui) => {
			await ui.wrap((ui) => ui.header('Item'), 1);
			await ui.json(item);
		});
		return item;
	}
);
