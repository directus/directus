import { command } from '../../../../core/command';

export default command(
	{
		group: 'items',
		parameters: '<collection>',
		description: 'Delete many items in a collection',
		usage: `
			**With multiple params**

			\`\`\`
			$ $0 items delete many <collection> \\
				--id 1 \\
				--id 2 \\
				--id 3
			\`\`\`

			**With combined values**

			\`\`\`
			$ $0 items delete many <collection> \\
				--id 1 2 3 4 5 6
			\`\`\`
		`,
		hints: ['del', 'rm', 'remove', 'exclude', 'destroy', 'explode'],
		documentation: `
			Deletes many items by their primary keys.
		`,
		features: {
			sdk: true,
		},
		options: function (builder) {
			return builder
				.option('id', {
					type: 'array',
					description: 'A list of ids to be deleted',
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
		await sdk.items(params.collection).deleteMany(params.id);
		await output.compose(async (ui) => {
			await ui.wrap((ui) => ui.text('Items successfully deleted'), 1);
		});

		return {
			deleted: true,
		};
	}
);
