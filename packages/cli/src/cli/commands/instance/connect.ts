import chalk from 'chalk';
import { Directus } from '@directus/sdk';
import { InstanceConfiguration } from '../../../config';
import { command } from '../../../core/command';
import { CLIRuntimeError } from '../../../core/exceptions';

export default command(
	{
		group: 'instance',
		parameters: '<url>',
		description: 'Connects to a Directus instance',
		usage: `
			**Public authentication**

			\`\`\`
			$ $0 instance connect <url> --public
			\`\`\`

			**With static tokens**

			\`\`\`
			$ $0 instance connect <url> \\
			    --token <token>
			\`\`\`

			**With credentials**

			\`\`\`
			$ $0 instance connect <url> \\
			    --email <email> \\
			    --password <password>
			\`\`\`

			**Named instance**

			\`\`\`
			$ $0 instance connect <url> \\
				--name dev \\
			    --public
			\`\`\`
		`,
		documentation: `
			Tries to connect to a Directus instance and authenticate with
			the provided authentication method.

			If you dont pass the instance name, *default* is used as the
			instance name. Registering already existing instance names
			will throw an error, disconnect the instance first or use the
			*--force* option to overwrite the existing configuration.

			On success, this instance's information (plus auth information)
			is **saved** in the system configuration file, located within
			your home folder.

			*~/.directus/directus.yml*
		`,
		options: function (builder) {
			return builder
				.positional('url', {
					type: 'string',
					description: 'The Directus endpoint to connect to',
					demandOption: true,
				})
				.option('name', {
					type: 'string',
					default: 'default',
					description: 'The local assigned instance name',
				})
				.option('force', {
					type: 'boolean',
					default: false,
					description: 'Overwrite the current instance config if it already exists',
				})
				.option('public', {
					type: 'boolean',
					default: false,
					description: 'Use public access',
				})
				.option('token', {
					type: 'string',
					description: 'The static authentication token',
				})
				.option('email', {
					type: 'string',
					description: 'The user email',
				})
				.option('password', {
					type: 'string',
					description: 'The user password',
				});
		},
	},
	async function ({ output, config }, params) {
		if (params.name in config.system.data.instances) {
			if (!params.force) {
				throw new CLIRuntimeError(`Instance "${params.name}" already connected`);
			}
		}

		const sdk = new Directus(params.url!);
		const instance: InstanceConfiguration = {
			auth: 'public',
			endpoint: params.url!,
			data: {},
		};

		if (params.public) {
			instance.auth = 'public';
		} else if (params.token) {
			instance.auth = 'token';
			instance.data!.auth_token = params.token;
			await sdk.auth.static(params.token);
		} else if (params.email && params.password) {
			instance.auth = 'credentials';
			await sdk.auth.login({
				email: params.email,
				password: params.password,
			});
			instance.data = {
				auth_expires: sdk.storage.auth_expires,
				auth_token: sdk.storage.auth_token,
				auth_refresh_token: sdk.storage.auth_refresh_token,
			};
		} else {
			throw new CLIRuntimeError('Unspecified authentication method.');
		}

		config.system.data.instances[params.name] = instance;
		config.system.save();

		await output.compose(async (ui) => {
			await ui.wrap(
				(builder) =>
					builder.line(
						`Successfully connect to ${chalk.bold(params.name)} through ${chalk.bold(instance.auth)} authentication`
					),
				1
			);
		});

		return {
			success: true,
			mode: instance.auth,
		};
	}
);
