import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';

export const requireYaml = (filepath: string) => {
	const yamlRaw = readFileSync(filepath, 'utf8');
	return yaml.load(yamlRaw);
};
