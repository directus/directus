import { command } from '../../../../core/command';
import { parseJson } from '../../../../core/parsers';
import { CLIRuntimeError } from '../../../../core/exceptions';

export default command(
	{
		group: 'items',
		parameters: '<collection>',
		description: 'Update many items in a collection',
		usage: `
			**Inline update**

			\`\`\`
			$ $0 items update many <collection> \\
				--id 1 2 3 4 \\
				--data="{...}"
			\`\`\`

			\`\`\`
			$ $0 items update many <collection> \\
				--id 1 \\
				--id 2 \\
				--data="{...}"
			\`\`\`

			\`\`\`
			$ $0 items update many <collection> \\
				--id 4719da4c-218c-4bd5-bbc9-f7152d8fed0a \\
				--id e0f75a9b-8282-4dab-b1b0-a5958758af67 \\
				--data="{...}"
			\`\`\`

			**Load item from stdin (JSON)**

			\`\`\`
			$ cat items.json | $0 items update many <collection> \\
				--id 1 2 3 4 \\
				--data-stdin=json
			\`\`\`

			**Load item from stdin (YAML)**

			\`\`\`
			$ cat items.yaml | $0 items update many <collection> \\
				--id 1 2 3 4 \\
				--data-stdin=yaml
			\`\`\`
		`,
		documentation: `
			Update many items in a collection. You have to specify all
			the primary keys that will received the update using --id.
		`,
		features: {
			sdk: true,
			query: 'many',
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
					type: 'array',
					description: 'A list of ids to be updated',
					demandOption: true,
				})
				.option('data', {
					type: 'string',
					description: `
						A partial object containing fields to be updated.

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
				Must be an array, received "${typeof data}".
				Maybe check your quote escapes?
			`);
		}

		const result = await sdk.items(params.collection).updateMany(params.id, data, query.many);
		await output.compose(async (ui) => {
			if (result.data) {
				await ui.wrap((ui) => ui.header('Updated'), 1);
				await ui.json(result.data);
			} else {
				await ui.wrap((ui) => ui.text('Nothing changed'), 1);
			}

			if (result.meta) {
				await ui.wrap((ui) => ui.header('Metadata'), 1);
				await ui.json(result.meta);
			}
		});

		if (result.meta) {
			return result;
		}

		return result.data;
	}
);
