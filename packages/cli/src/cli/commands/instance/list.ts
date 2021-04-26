import { command } from '../../../core/command';
import { FullTerminalWidth } from '../../../core/output/ui';

export default command(
	{
		group: 'instance',
		description: 'Lists connected Directus instances',
		usage: `
			\`\`\`
			$ $0 instance list
			\`\`\`
		`,
		documentation: `
			Lists all configured instances in this machine. These instances
			can be selected using **--instance** option in commands that needs
			to connect to the remote instance, or configured to be automatically
			selected by the CLI through **.directusrc** files located in the
			working directory.
		`,
	},
	async function ({ config, output }, _params) {
		const instances = Object.entries(config.system.data.instances).map(([name, { endpoint, auth }]) => ({
			name,
			auth,
			endpoint,
		}));

		await output.compose(async (ui) => {
			ui.configure({
				width: FullTerminalWidth,
			});

			if (instances.length <= 0) {
				await ui.wrap((builder) => builder.line('No instances available'), 1);
				return;
			}

			await ui.wrap(
				(builder) =>
					builder.table(
						instances.map((instance) => [instance.name, instance.auth, instance.endpoint]),
						{
							head: ['Name', 'Auth', 'Endpoint'],
						}
					),
				1
			);
		});

		return instances;
	}
);
