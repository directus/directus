import { command } from '../../../../core/command';
import { parseJson } from '../../../../core/parsers';
import { CLIRuntimeError } from '../../../../core/exceptions';

export default command(
	{
		group: 'items',
		parameters: '<collection>',
		description: 'Update one item in a collection',
		usage: `
			**Inline update**

			\`\`\`
			$ $0 items update one <collection> --id <id> --item="{...}"
			\`\`\`

			**Load item from stdin (JSON)**

			\`\`\`
			$ cat item.json | $0 items update one <collection> \\
				--id <id> \\
				--item-stdin=json
			\`\`\`

			**Load item from stdin (YAML)**

			\`\`\`
			$ cat item.yaml | $0 items update one <collection> \\
				--id <id> \\
				--item-stdin=yaml
			\`\`\`
		`,
		documentation: `
			Update one item by it's primary key.
		`,
		features: {
			sdk: true,
			query: 'one',
			stdin: {
				'item-stdin': {
					formats: ['json', 'yaml'],
					exclusive: ['item'],
				},
			},
		},
		hints: ['update', 'write', 'set', 'change', 'item update'],
		options: function (builder) {
			return builder
				.option('id', {
					type: 'string',
					description: "The item's primary key id",
					demandOption: true,
				})
				.option('item', {
					type: 'string',
					description: `
						The fields to update in the item.
						Only the specified fields will be updated.

						**Accepts a JSON encoded string.**
					`,
				})
				.positional('collection', {
					type: 'string',
					description: "The collection's name",
					demandOption: true,
				});
		},
	},
	async function ({ output, query, sdk, stdin }, params) {
		let item = {};

		if (params.item) {
			item = parseJson(params.item);
		} else if (stdin) {
			item = stdin;
		} else {
			throw new CLIRuntimeError('Missing item data from --item-stdin or --item');
		}

		if (typeof item !== 'object') {
			throw new CLIRuntimeError(`
				Invalid item data.
				Must be an object, received "${typeof item}".
				Maybe check your quote escapes?
			`);
		}

		const updated = await sdk.items(params.collection).updateOne(params.id, item, query.one);
		await output.compose(async (ui) => {
			if (updated) {
				await ui.wrap((ui) => ui.header('Updated'), 1);
				await ui.json(updated);
			} else {
				await ui.wrap((ui) => ui.text('Nothing changed'), 1);
			}
		});

		return updated;
	}
);
