import { readFileSync } from 'node:fs';
import { parseJSON } from '@directus/shared/utils';

const { version } = parseJSON(readFileSync('../../package.json', 'utf8')) as {
	version: string;
};

export { version };
