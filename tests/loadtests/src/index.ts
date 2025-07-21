import {
	createDirectus,
	rest,
	staticToken,
	type DirectusClient,
	type RestClient,
	type StaticTokenClient,
} from '@directus/sdk';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { Command, Option, program } from 'commander';
import { join } from 'path';
import { argv } from 'process';
import { config, platforms, type Platform } from './config.js';
import { createLogger, type Logger } from './logger.js';
import { existsSync } from 'fs';

export type SDK = DirectusClient<any> & RestClient<any> & StaticTokenClient<any>;
export type SetupArgs = {
	sdk: SDK;
	program: Command;
	logger: Logger;
};

program
	.option('-b, --build', 'Rebuild Directus from source')
	.option('--build-api', 'Rebuild only the api from source')
	.addOption(new Option('-p, --platform [platform]', 'Automatically spin up docker images').choices(platforms))
	.option('--test', 'Startup directus without running k6')
	.option('-f, --file <file>', 'Specify the test file k6 should use', 'test')
	.argument('<test>');

program.parse();

const logger = createLogger();

const distFolder = join(import.meta.dirname, '..', '..', '..', 'api', 'dist');

const options = program.opts() as {
	platform?: true | Platform;
	build: boolean;
	test: boolean;
	buildApi: string;
	file: string;
};

const platform: Platform | undefined = options.platform === true ? 'postgres' : options.platform;

// catches ctrl+c event
process.on('SIGINT', exitHandler);

// Rebuild directus
if (options.build || options.buildApi) {
	logger.info('Rebuilding Directus');

	const cwd = options.buildApi
		? join(import.meta.dirname, '..', '..', '..', 'api')
		: join(import.meta.dirname, '..', '..', '..');

	const build = spawn(/^win/.test(process.platform) ? 'pnpm.cmd' : 'pnpm', ['run', 'build'], {
		cwd,
		shell: true,
	});

	logger.pipe(build.stdout);
	logger.pipe(build.stderr, 'error');

	await new Promise((resolve) => build.on('close', resolve));

	logger.info('New Build Complete');
}

let docker: undefined | ChildProcessWithoutNullStreams;

if (platform) {
	if (existsSync(join(import.meta.dirname, '..', 'docker', `${platform}.yml`))) {
		docker = spawn('docker', [
			'compose',
			'-f',
			join(import.meta.dirname, '..', 'docker', `${platform}.yml`),
			'up',
			'-d',
			'--wait',
		]);

		logger.pipe(docker.stdout);
		logger.pipe(docker.stderr, 'error');

		await new Promise((resolve) => docker!.on('close', resolve));
	}

	const bootstrap = spawn('node', [join(distFolder, 'cli', 'run.js'), 'bootstrap'], {
		env: config[platform],
	});

	logger.pipe(bootstrap.stdout);
	logger.pipe(bootstrap.stderr, 'error');

	await new Promise((resolve) => bootstrap.on('close', resolve));
}

const apiLogger = createLogger('api');

const api = spawn('node', [join(distFolder, 'cli', 'run.js'), 'start'], {
	env: config[platform!],
});

apiLogger.pipe(api.stderr, 'error');

await new Promise((resolve, reject) => {
	api.stdout.on('data', (data) => {
		apiLogger.info(String(data));
		if (String(data).includes(`Server started at http://${config['mariadb'].HOST}:${config['mariadb'].PORT}`))
			resolve(null);
	});

	// In case the api takes too long to start
	setTimeout(reject, 10000);
});

if (platform) {
	const setupLogger = createLogger('setup');

	const sdk = createDirectus(`http://${config['mariadb'].HOST}:${config['mariadb'].PORT}`)
		.with(rest())
		.with(staticToken('admin'));

	const setup = await import(`../tests/${program.args[0]!}/setup.js`);
	await setup.setup({ sdk, logger: setupLogger, program });
}

let k6: ChildProcessWithoutNullStreams | undefined;

if (!options.test) {
	const k6Logger = createLogger('k6');

	k6 = spawn('k6', [
		'run',
		'-e',
		`HOST=${config['mariadb'].HOST}`,
		'-e',
		`PORT=${config['mariadb'].PORT}`,
		join(import.meta.dirname, '..', 'tests', program.args[0]!, `${options.file}.ts`),
	]);

	k6Logger.pipe(k6.stdout);
	k6Logger.pipe(k6.stderr, 'error');

	await new Promise((resolve) => k6!.on('close', resolve));

	if (platform) await stopDocker();
	await exitHandler();
}

async function stopDocker() {
	if (argv.some((arg) => arg === '--docker')) {
		const docker = spawn('docker', [
			'compose',
			'-f',
			join(import.meta.dirname, '..', 'docker', `${platform}.yml`),
			'down',
		]);

		await new Promise((resolve) => docker.on('close', resolve));
	}
}

async function exitHandler() {
	if (platform) {
		logger.info('Stoppoing Docker');
		await stopDocker();
	}

	api.kill();
	k6?.kill();

	logger.info('Bye');
	process.exit();
}
