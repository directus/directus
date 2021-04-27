import { Toolbox } from '../../toolbox';
import JSON5 from 'json5';

export default (toolbox: Toolbox) => {
	toolbox.query = {
		one: {},
		many: {},
	};

	toolbox.options.register((builder, command) => {
		if (!command.settings?.features?.query || !command.settings?.features?.sdk) {
			return builder;
		}

		builder = builder
			.option('deep', {
				type: 'string',
				description: 'Allows you to set any of the other query parameters on a nested relational dataset.',
			})
			/*
			.option('export', {
				type: 'string',
				choices: ['csv', 'json'],
				description: 'Allows you to set any of the other query parameters on a nested relational dataset.',
			})*/
			.option('fields', {
				type: 'array',
				description: 'Choose the fields that are returned in the current dataset.',
			});

		if (command.settings?.features?.query === 'many') {
			builder = builder.option('limit', {
				type: 'number',
				default: 100,
				description: 'Set the maximum number of items that will be returned. The default limit is set to 100.',
			});
		}

		return builder;
	});

	toolbox.events.on('command.execute.before', async (command, options) => {
		if (!command.settings?.features?.query || !command.settings?.features?.sdk) {
			return;
		}

		const normalize = (value: any) => {
			if (typeof value === 'undefined') {
				return undefined;
			}
			return JSON5.parse(value);
		};

		toolbox.query = {
			one: {
				deep: normalize(options.deep),
				export: options.export,
				fields: options.fields,
				filter: normalize(options.filter),
				search: options.search,
			},
			many: {
				deep: options.deep,
				export: options.export,
				fields: options.fields,
				filter: options.filter,
				search: options.search,
				limit: options.limit,
				meta: options.meta,
				offset: options.offset,
				page: options.page,
				single: options.single,
				sort: options.sort,
			},
		};
	});
};
