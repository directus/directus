import yaml from 'js-yaml';
import JSON5 from 'json5';

export function parseJson(value: string) {
	if (typeof value === 'undefined') {
		return undefined;
	}
	return JSON5.parse(value);
}

export function parseYaml(value: string) {
	if (typeof value === 'undefined') {
		return undefined;
	}
	return yaml.load(value);
}
