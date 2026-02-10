import { readFileSync } from 'node:fs';
import { type DotenvParseOutput, parse } from 'dotenv';

export const readConfigurationFromDotEnv = (path: string): DotenvParseOutput => {
	return parse(readFileSync(path));
};
