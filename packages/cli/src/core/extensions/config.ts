import * as os from 'os';
import * as path from 'path';

import { Toolbox } from '../../toolbox';
import { ProjectConfiguration, SystemConfiguration } from '../../config';
import { YamlConfiguration, StaticConfiguration } from '../config';

export const system = new YamlConfiguration<SystemConfiguration>({
	name: 'directus',
	directory: path.join(os.homedir(), '.directus'),
	file: 'directus.yml',
	defaults: {
		instances: {},
	},
});

export const project = new StaticConfiguration<ProjectConfiguration>({
	name: 'directus',
	files: [
		'.directus.yml',
		'.directus.yaml',
		'.directus.json',
		'.directus.js',
		'.directusrc',
		'.directusrc.yml',
		'.directusrc.yaml',
		'.directusrc.json',
		'.directusrc.json5',
		'.directusrc.js',
		'directus.config.yml',
		'directus.config.yaml',
		'directus.config.json',
		'directus.config.json5',
		'directus.config.js',
	],
	defaults: {
		instance: 'default' in system.data.instances ? 'default' : undefined,
		experimental: {
			cli: {
				community_extensions: !!process.env.EXPERIMENTAL_CLI_COMMUNITY_EXTENSIONS,
				typescript: {
					enabled: false,
					tsconfig: './tsconfig.json',
					source: undefined,
				},
			},
		},
	},
});

export default (toolbox: Toolbox): void => {
	toolbox.config = {
		system,
		project,
	};
};
