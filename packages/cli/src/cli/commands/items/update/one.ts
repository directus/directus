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
			$ $0 items update one <collection> --id <id> --data="{...}"
			\`\`\`

			**Load item from stdin (JSON)**

			\`\`\`
			$ cat data.json | $0 items update one <collection> \\
				--id <id> \\
				--data-stdin=json
			\`\`\`

			**Load item from stdin (YAML)**

			\`\`\`
			$ cat data.yaml | $0 items update one <collection> \\
				--id <id> \\
				--data-stdin=yaml
			\`\`\`
		`,
		documentation: `
			Update one item by it's primary key.
		`,
		features: {
			sdk: true,
			query: 'one',
			stdin: {
				'data-stdin': {
					formats: ['json', 'yaml'],
					exclusive: ['data'],
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
				.option('data', {
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
		let data = {};

		if (params.data) {
			data = parseJson(params.data);
		} else if (stdin) {
			data = stdin;
		} else {
			throw new CLIRuntimeError('Missing item data from --data-stdin or --data');
		}

		if (typeof data !== 'object') {
			throw new CLIRuntimeError(`
				Invalid item data.
				Must be an object, received "${typeof data}".
				Maybe check your quote escapes?
			`);
		}

		const updated = await sdk.items(params.collection).updateOne(params.id, data, query.one);
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
