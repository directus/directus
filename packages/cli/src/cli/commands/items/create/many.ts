import { command } from '../../../../core/command';
import { parseJson } from '../../../../core/parsers';
import { CLIRuntimeError } from '../../../../core/exceptions';

export default command(
	{
		group: 'items',
		parameters: '<collection>',
		description: 'Create many items in a collection',
		usage: `
			**Inline creation**

			\`\`\`
			$ $0 items create many <collection> --data="[{...}]"
			\`\`\`

			**Load item from stdin (JSON)**

			\`\`\`
			$ cat data.json | $0 items create many <collection> \\
				--data-stdin=json
			\`\`\`

			**Load item from stdin (YAML)**

			\`\`\`
			$ cat data.yaml | $0 items create many <collection> \\
				--id <id> \\
				--data-stdin=yaml
			\`\`\`
		`,
		documentation: `
			Creates many items in a collection.
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
		hints: ['create', 'new', 'add', 'insert'],
		options: function (builder) {
			return builder
				.option('data', {
					type: 'string',
					description: `
						The array of items to be created.

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
			throw new CLIRuntimeError('Missing items data from --data-stdin or --data');
		}

		if (!Array.isArray(data)) {
			throw new CLIRuntimeError(`
				Invalid items data.
				Must be an array, received "${typeof data}".
				Maybe check your quote escapes?
			`);
		} else if (data.some((item) => typeof item !== 'object')) {
			throw new CLIRuntimeError(`
				Invalid items data.
				Not all entries are objects.
			`);
		}

		const result = await sdk.items(params.collection).createMany(data, query.one);
		await output.compose(async (ui) => {
			await ui.wrap((ui) => ui.header('Created'), 1);
			await ui.json(result.data);

			if (result.meta) {
				await ui.wrap((ui) => ui.header('Meta'), 1);
				await ui.json(result.meta);
			}
		});

		if (result.meta) {
			return result;
		}

		return result.data;
	}
);
