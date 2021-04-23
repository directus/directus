import * as os from 'os';
import * as path from 'path';

import { Toolbox } from '../../toolbox';
import { ProjectConfiguration, SystemConfiguration } from '../../config';
import { YamlConfiguration, StaticConfiguration } from '../config';

export default (toolbox: Toolbox) => {
	const system = new YamlConfiguration<SystemConfiguration>({
		name: 'directus',
		directory: path.join(os.homedir(), '.directus'),
		file: 'directus.yml',
		defaults: {
			instances: {},
		},
	});

	const project = new StaticConfiguration<ProjectConfiguration>({
		name: 'directus',
		files: [
			'package.json',
			'.directus.yml',
			'.directusrc.yml',
			'.directus.yaml',
			'.directusrc.yaml',
			'.directus.js',
			'.directusrc.js',
			'.directus.json',
			'.directusrc.json',
			'directus.config.js',
			'directus.config.json',
		],
		defaults: {
			instance: 'default' in system.data.instances ? 'default' : undefined,
		},
	});

	toolbox.config = {
		system,
		project,
	};
};
