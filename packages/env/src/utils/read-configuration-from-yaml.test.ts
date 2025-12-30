import { readConfigurationFromYaml } from './read-configuration-from-yaml.js';
import { requireYaml } from '@directus/utils/node';
import { isPlainObject } from 'lodash-es';
import { expect, test, vi } from 'vitest';

vi.mock('@directus/utils/node');
vi.mock('lodash-es');

test('Returns yaml from given path if it contains a plain object', () => {
	const config = { test: 'foo' };

	vi.mocked(requireYaml).mockReturnValue(config);
	vi.mocked(isPlainObject).mockReturnValue(true);

	const output = readConfigurationFromYaml('./test/path/yaml');

	expect(output).toBe(config);
});

test('Throws error if yaml does not contain a plain object', () => {
	vi.mocked(isPlainObject).mockReturnValue(false);

	expect(() => readConfigurationFromYaml('./test/path.yaml')).toThrowErrorMatchingInlineSnapshot(
		`[Error: YAML configuration file does not contain an object]`,
	);
});
