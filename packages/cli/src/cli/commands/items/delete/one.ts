import { command } from '../../../../core/command';

export default command(
	{
		group: 'items',
		parameters: '<collection>',
		description: 'Delete one item in a collection',
		usage: `
			\`\`\`
			$ $0 items delete one <collection> --id <id>
			\`\`\`
		`,
		hints: ['del', 'rm', 'remove', 'exclude', 'destroy', 'explode'],
		documentation: `
			Deletes one item by it's primary key.
		`,
		features: {
			sdk: true,
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
	async function ({ output, sdk }, params) {
		await sdk.items(params.collection).deleteOne(params.id);
		await output.compose(async (ui) => {
			await ui.wrap((ui) => ui.text('Item successfully deleted'), 1);
		});

		return {
			deleted: true,
		};
	}
);
