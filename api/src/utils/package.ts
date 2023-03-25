import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('../../package.json', 'utf8')) as {
	version: string;
};

export { version };
