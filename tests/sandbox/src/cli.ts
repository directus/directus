import { Argument, program } from 'commander';
import { databases, sandbox, type Database } from './sandbox.js';

program
	.addArgument(new Argument('<database>', 'What database to start the api with').choices(databases))
	.option('-b, --build', 'Rebuild directus from source')
	.option('-d, --dev', 'Start directus in developer mode. Not compatible with build')
	.option('-w, --watch', 'Restart the api when changes are made')
	.option('--inspect', 'Start the api with debugger', true)
	.option('-p, --port <port>', 'Port to start the api on')
	.option('-x, --export', 'Export the schema to a file every 2 seconds')
	.option('-s, --schema [schema]', 'Load an additional schema snapshot on startup')
	.option('--docker.basePort <dockerBasePort>', 'Minimum port number to use for docker containers')
	.option('--docker.keep', 'Keep containers running when stopping the sandbox')
	.option('-e, --extras <extras>', 'Enable redis,maildev,saml or other extras')
	.option('-i, --instances <instances>', 'Horizontally scale directus to a given number of instances', '1');

program.parse();
const options = program.opts();

const sb = await sandbox(program.args[0] as Database, {
	...options,
	docker: {
		basePort: options['docker.basePort'],
		keep: options['docker.keep'],
	},
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
		await sb.stop();
		resolve(undefined);
	});

	process.on('SIGTERM', async () => {
		await sb.stop();
		resolve(undefined);
	});
});
