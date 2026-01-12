import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';

export const requireYaml = (filepath: string) => {
	const yamlRaw = readFileSync(filepath, 'utf8');
	return yaml.load(yamlRaw);
};
