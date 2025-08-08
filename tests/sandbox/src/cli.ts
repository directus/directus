import { program } from 'commander';
import { sandbox, type Database } from './sandbox.js';

program
	.argument('<database>')
	.option('-b, --build', 'Rebuild directus from source')
	.option('-d, --dev')
	.option('-w, --watch')
	.option('-p, --port <port>')
	.option('--dockerBasePort <dockerBasePort>')
	.option('-e, --extras <extras>');

program.parse();
const options = program.opts();

const stopSandbox = await sandbox(program.args[0] as Database, {
	...options,
	extras: options['extras']
		? Object.fromEntries(
				String(options['extras'])
					.split(',')
					.map((extra) => [extra, true]),
			)
		: {},
});

await new Promise((resolve) => {
	process.on('SIGINT', async () => {
		await stopSandbox();
		resolve(undefined);
	});

	process.on('SIGTERM', async () => {
		await stopSandbox();
		resolve(undefined);
	});
});
