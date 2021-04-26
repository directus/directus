import chalk from 'chalk';
import { Directus } from '@directus/sdk';
import { command } from '../../../core/command';
import { CLIRuntimeError } from '../../../core/exceptions';
import { InstanceStorage } from '../../../core/sdk/storage';

export default command(
	{
		group: 'instance',
		parameters: '<url>',
		description: 'Disconnects from a Directus instance',
		usage: `
			**From default instance**

			\`\`\`
			$ $0 instance disconnect
			\`\`\`

			**From a named instance**

			\`\`\`
			$ $0 instance disconnect dev
			\`\`\`
		`,
		documentation: `
			Tries to logout from the instance and erases the associated
			data from the system configuration file. If logout fails it
			will still remove the associated data from the configuration
			file.

			*~/.directus/directus.yml*
		`,
		options: function (builder) {
			return builder.positional('name', {
				type: 'string',
				default: 'default',
			});
		},
	},
	async function ({ output, config }, params) {
		if (!(params.name in config.system.data.instances)) {
			throw new CLIRuntimeError(`Unknown instance: ${params.name}`);
		}

		const instance = config.system.data.instances[params.name]!;

		try {
			const sdk = new Directus(instance.endpoint, {
				storage: new InstanceStorage(params.name, config.system),
			});
			await sdk.auth.logout();
		} catch (_) {
			// pass
		}

		delete config.system.data.instances[params.name];
		config.system.save();

		await output.compose(async (ui) => {
			await ui.wrap((ui) => ui.line(`Successfully disconnected from ${chalk.bold(params.name)}`), 1);
		});

		return {
			success: true,
		};
	}
);
