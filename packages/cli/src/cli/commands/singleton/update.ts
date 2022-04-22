import { command } from '../../../core/command';
import { parseJson } from '../../../core/parsers';
import { CLIRuntimeError } from '../../../core/exceptions';

export default command(
	{
		group: 'singletons',
		parameters: '<collection>',
		description: 'Update a singleton collection data',
		usage: `
			**Inline update**

			\`\`\`
			$ $0 singleton update <collection> --data="{...}"
			\`\`\`

			**Load item from stdin (JSON)**

			\`\`\`
			$ cat item.json | $0 singleton update <collection> \\
				--data-stdin=json
			\`\`\`

			**Load item from stdin (YAML)**

			\`\`\`
			$ cat item.yaml | $0 singleton update <collection> \\
				--data-stdin=yaml
			\`\`\`
		`,
		documentation: `
			Update data of a singleton collection. Singleton
			collections are collections that only contains a single row
			and is used as a key/value storage.
		`,
		features: {
			sdk: true,
			query: 'one',
			stdin: {
				'data-stdin': {
					formats: ['json', 'yaml'],
					exclusive: ['item'],
				},
			},
		},
		hints: [
			'single update',
			'single write',
			'single set',
			'single change',
			'write single',
			'set single',
			'change single',
		],
		options: function (builder) {
			return builder
				.option('data', {
					type: 'string',
					description: `
						The fields to update in the collection.
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

		const updated = await sdk.singleton(params.collection).update(data, query.one);
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
