import { parse } from 'dotenv';
import { readFileSync } from 'node:fs';

export const readConfigurationFromDotEnv = (path: string) => {
	return parse(readFileSync(path));
};
