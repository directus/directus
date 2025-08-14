import { program } from 'commander';
import { sandbox, type Database } from './sandbox.js';

program
	.argument('<database>')
	.option('-b, --build', 'Rebuild directus from source')
	.option('-d, --dev', 'Start directus in developer mode. Not compatible with build.')
	.option('-w, --watch', 'Restart directus when changes are made to the api.')
	.option('-p, --port <port>', 'Port to start directus on.')
	.option('-x, --schema', 'Export the schema to a file every 2 seconds')
	.option('--dockerBasePort <dockerBasePort>', 'Minimum port number to use for docker containers')
	.option('-e, --extras <extras>', 'Enable redis,maildev,saml or other extras')
	.option('-s, --scale <instances>', 'Horizontally scale directus to a given number of instances. Minimum 1', '1');

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
