import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';

export const readConfigurationFromDotEnv = (path: string) => {
	return parse(readFileSync(path));
};
