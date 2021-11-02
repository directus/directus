import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../../logger';

export default async function usersCreate({ show }: { show?: boolean }): Promise<void> {
	const key = uuidv4();

	if (show) {
		process.stdout.write(`Your new App Key: ${key}\n`);

		process.exit(0);
	}

	const rootPath = process.cwd();
	const envPath = pathJoin(rootPath, '.env');

	if (!existsSync(envPath)) {
		logger.error(`No .env file found at ${envPath}`);
		process.exit(1);
	}

	const envFileContent = readFileSync(envPath)
		.toString()
		.replace(/^KEY=(.*)$/gm, `KEY="${key}"`);

	writeFileSync(envPath, envFileContent);

	process.stdout.write('App Key set correctly.\n');
}
