import { nanoid } from 'nanoid';

export default async function generateSecret(): Promise<void> {
	process.stdout.write(nanoid(32));
	process.exit(0);
}
