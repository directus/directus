import { nanoid } from 'nanoid';

export default async function generateSecret(): Promise<void> {
	const SECRET = nanoid(32);

	process.stdout.write(`Your new app secret: ${SECRET}\n`);
	process.exit(0);
}
