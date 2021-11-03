import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { nanoid } from 'nanoid';
import logger from '../../../logger';

export default async function generateSecret({ show }: { show?: boolean }): Promise<void> {
	const SECRET = nanoid(32);

	if (show) {
		process.stdout.write(`Your new app secret: ${SECRET}\n`);

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
		.replace(/^SECRET=(.*)$/gm, `SECRET="${SECRET}"`);

	writeFileSync(envPath, envFileContent);

	process.stdout.write('App secret set correctly.\n');
}
