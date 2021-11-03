import { v4 as uuidv4 } from 'uuid';

export default async function generateKey(): Promise<void> {
	const key = uuidv4();

	process.stdout.write(`Your new app key: ${key}\n`);
	process.exit(0);
}
