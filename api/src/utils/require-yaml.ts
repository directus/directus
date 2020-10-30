import fse from 'fs-extra';
import yaml from 'js-yaml';

export function requireYAML(filepath: string) {
	const yamlRaw = fse.readFileSync(filepath, 'utf8');

	return yaml.safeLoad(yamlRaw) as Record<string, any>;
}
