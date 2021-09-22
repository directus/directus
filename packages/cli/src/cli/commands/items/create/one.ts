import { command } from '../../../../core/command';
import { parseJson } from '../../../../core/parsers';
import { CLIRuntimeError } from '../../../../core/exceptions';

export default command(
	{
		group: 'items',
		parameters: '<collection>',
		description: 'Create one item in a collection',
		usage: `
			**Inline creation**

			\`\`\`
			$ $0 items create one <collection> --data="{...}"
			\`\`\`

			**Load item from stdin (JSON)**

			\`\`\`
			$ cat data.json | $0 items create one <collection> \\
				--data-stdin=json
			\`\`\`

			**Load item from stdin (YAML)**

			\`\`\`
			$ cat data.yaml | $0 items create one <collection> \\
				--id <id> \\
				--data-stdin=yaml
			\`\`\`
		`,
		documentation: `
			Create one item in a collection
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
		hints: ['create', 'new', 'add', 'insert'],
		options: function (builder) {
			return builder
				.option('data', {
					type: 'string',
					description: `
						The item data to be created.

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

		const result = await sdk.items(params.collection).createOne(data, query.one);
		await output.compose(async (ui) => {
			await ui.wrap((ui) => ui.header('Created'), 1);
			await ui.json(result);
		});

		return result;
	}
);
