import { Toolbox } from '../../toolbox';

export default (toolbox: Toolbox) => {
	toolbox.query = {
		one: {},
		many: {},
	};

	toolbox.options.register((builder, command) => {
		if (!command.settings?.features?.query || !command.settings?.features?.sdk) {
			return builder;
		}
		return builder.option('instance', {
			default: toolbox.config.project.data.instance || 'default',
			description: 'The instance name the command should use to talk to Directus api.',
		});
	});

	toolbox.events.on('command.execute.before', async (command, options) => {
		if (!command.settings?.features?.query || !command.settings?.features?.sdk) {
			return;
		}

		toolbox.query = {
			one: {
				deep: options.deep,
				export: options.export,
				fields: options.fields,
				filter: options.filter,
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
