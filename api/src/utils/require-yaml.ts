import { requireText } from './require-text.js';
import yaml from 'js-yaml';

export function requireYAML(filepath: string): Record<string, any> {
	const yamlRaw = requireText(filepath);
	return yaml.load(yamlRaw) as Record<string, any>;
}
