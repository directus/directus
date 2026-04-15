import { Argument, program } from 'commander';
import { type Database, databases, sandbox } from './sandbox.js';

program
	.name('sandbox')
	.description('CLI for spinning up directus sandboxes for testing and development purposes')
	.version('1.0.0')
	.addArgument(new Argument('<database>', 'What database to start the api with').choices(databases))
	.option('-b, --build', 'Rebuild directus from source')
	.option('-d, --dev', 'Start directus in developer mode. Not compatible with build')
	.option('-w, --watch', 'Restart the api when changes are made')
	.option('-p, --port <port>', 'Port to start the api on')
	.option('-a, --app [port]', 'Spin up the app in dev mode')
	.option('--inspect', 'Start the api with debugger', true)
	.option('-i, --instances <instances>', 'Horizontally scale directus to a given number of instances', '1')
	.option('--db-version <version>', 'Which version of the database to use')
	.option('--docker.port <port>', 'Minimum port number to use for docker containers')
	.option('--docker.keep', 'Keep containers running when stopping the sandbox')
	.option('--docker.name <name>', 'Overwrite the name of the docker project')
	.option('--docker.suffix <suffix>', 'Adds a suffix to the docker project. Can be used to ensure uniqueness')
	.option(
		'--env <env...>',
		'Add environment variables that the api should start with. Format: KEY=VALUE',
		(value, previous) => {
			const [key, ...rest] = value.split('=');
			const val = rest.join('=');
			return { ...previous, [key!]: val };
		},
		{},
	)
	.option('--cache', 'Enable or disable caching')
	.option('--prefix <prefix>', 'Prefix the logs, useful when starting multiple sandboxes')
	.option('-x, --export', 'Export the schema to a file every 2 seconds')
	.option('-s, --schema [schema]', 'Load an additional schema snapshot on startup')
	.option('-e, --extras <extras>', 'Enable redis,maildev,saml or other extras')
	.option('--silent', 'Silence all logs except for errors');

program.parse();
const options = program.opts();

const sb = await sandbox(program.args[0] as Database, {
	...options,
	port: options['port'] ?? 8055,
	docker: {
		port: options['docker.port'] ?? { min: 8100, max: 8200 },
		keep: options['docker.keep'],
		name: options['docker.name'],
		suffix: options['docker.suffix'],
	},
	extras: options['extras']
		? Object.fromEntries(
				String(options['extras'])
					.split(',')
					.map((extra) => [extra, true]),
			)
		: {},
});

await new Promise(() => {
	process.on('SIGINT', async () => {
		await sb.stop();
		process.exit();
	});

	process.on('SIGTERM', async () => {
		await sb.stop();
		process.exit();
	});
});
