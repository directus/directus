import chalk from 'chalk';
import { command } from '../../../core/command';

import prettyMs from 'pretty-ms';

export default command(
	{
		group: 'instance',
		description: "Show instance's information",
		usage: `
			\`\`\`
			$ $0 instance info
			\`\`\`
		`,
		documentation: `
			Show information about the selected instance.
		`,
		features: {
			sdk: true,
		},
		hints: ['inf', 'info', 'project info'],
	},
	async function ({ output, sdk }, _params) {
		const info = (await sdk.server.info()) as any; // TODO: remove cast when fixed in the SDK
		const unavailable = chalk.gray.italic('Unavailable');

		const { directus, node, os, project } = info;

		await output.compose(async (ui) => {
			await ui.wrap(async (ui) => {
				if (os) {
					await ui.skip();
					await ui.header('Server');
					await ui.skip();
					await ui.table(
						[
							[chalk.bold('Type'), os?.type || unavailable],
							[chalk.bold('Version'), os?.version || unavailable],
							[chalk.bold('Uptime'), prettyMs((os?.uptime || 0) * 1000)],
							[chalk.bold('Memory'), os?.totalmem || unavailable],
						],
						{
							alignments: ['right', 'left'],
						}
					);
				}

				if (node) {
					await ui.skip();
					await ui.header('Node');
					await ui.skip();
					await ui.table(
						[
							[chalk.bold('Version'), node?.version || unavailable],
							[chalk.bold('Uptime'), prettyMs((node?.uptime || 0) * 1000)],
						],
						{
							alignments: ['right', 'left'],
						}
					);
				}

				if (project) {
					await ui.skip();
					await ui.header('Project');
					await ui.skip();
					await ui.table(
						[
							[chalk.bold('Name'), project?.project_name || unavailable],
							[chalk.bold('Note'), project?.public_note || unavailable],
						],
						{
							alignments: ['right', 'left'],
						}
					);
				}

				if (directus) {
					await ui.skip();
					await ui.header('Directus');
					await ui.skip();
					await ui.table([[chalk.bold('Version'), directus?.version || unavailable]], {
						alignments: ['right', 'left'],
					});
				}
			}, 1);
		});

		return info;
	}
);
