import { Directus } from '@directus/sdk';
import { Toolbox } from '../../toolbox';
import { CLIRuntimeError } from '../exceptions';
import { InstanceStorage } from '../sdk/storage';

export default (toolbox: Toolbox) => {
	toolbox.sdk = new Directus('http://localhost:8055');

	toolbox.options.feature('sdk', (builder) => {
		return builder.option('instance', {
			default: toolbox.config.project.data.instance || 'default',
			description: 'The instance name the command should use to talk to Directus api.',
		});
	});

	toolbox.events.on('command.execute.before', async (command, options) => {
		if (!command.settings?.features?.sdk) {
			return;
		}

		const instances = toolbox.config.system.data.instances;
		if (!(options.instance in instances)) {
			throw new CLIRuntimeError(`Unknown instance: ${options.instance}`);
		}

		const instance = toolbox.config.system.data.instances[options.instance];

		const sdk = new Directus(instance?.endpoint!, {
			storage: new InstanceStorage(options.instance, toolbox.config.system),
		});

		if (instance?.auth === 'token') {
			await sdk.auth.static(instance.data?.auth_token);
		} else if (instance?.auth === 'credentials') {
			await sdk.auth.refresh();
			toolbox.config.system.save();
		}

		toolbox.sdk = sdk;
	});
};
