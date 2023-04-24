import fse from 'fs-extra';
import yaml from 'js-yaml';

export function requireYAML(filepath: string): Record<string, any> {
	const yamlRaw = fse.readFileSync(filepath, 'utf8');
	return yaml.load(yamlRaw) as Record<string, any>;
}
