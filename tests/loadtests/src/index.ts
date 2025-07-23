import {
	createDirectus,
	rest,
	staticToken,
	type DirectusClient,
	type RestClient,
	type StaticTokenClient,
} from '@directus/sdk';
import { ChildProcess, spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { Command, Option, program } from 'commander';
import { join } from 'path';
import { baseConfig, platforms, type Platform } from './config.js';
import { createLogger, type Logger } from './logger.js';
import { existsSync } from 'fs';
import { rimraf } from 'rimraf';
import zx from '@nitwel/0x';

export type SDK = DirectusClient<any> & RestClient<any> & StaticTokenClient<any>;
export type SetupArgs = {
	sdk: SDK;
	program: Command;
	logger: Logger;
};

program
	.option('-b, --build', 'Rebuild Directus from source')
	.option('--build-api', 'Rebuild only the api from source')
	.addOption(
		new Option('-p, --platform [platform]', 'Automatically spin up docker images').choices([...platforms, 'all']),
	)
	.option('--port <port>', 'Port to run directus from')
	.option('-d, --debug', 'Startup directus without running k6')
	.option('-t, --test <file>', 'Specify the test file k6 should use', 'test')
	.option('-f, --flamegraph', 'Generate a flamegraph at the end')
	.option('-w, --wait <seconds>', 'Wait for some seconds before bootstrapping')
	.argument('<test>');

program.parse();

const logger = createLogger();

const distFolder = join(import.meta.dirname, '..', '..', '..', 'api', 'dist');

const options = program.opts() as {
	platform?: true | Platform | 'all';
	build: boolean;
	debug: boolean;
	buildApi: string;
	test: string;
	flamegraph: boolean;
	port?: string;
	wait?: string;
};

const platform: Platform | undefined = options.platform === true ? 'postgres' : (options.platform as Platform);
const env = { ...baseConfig[platform ?? 'postgres'], PORT: options.port ?? '8055' };

if (options.flamegraph) {
	logger.info('Removing old Flamegraph');
	await rimraf(join(import.meta.dirname, '..', 'flamegraph'));
}

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

if (options.platform === 'all') {
	const tasks: ChildProcessWithoutNullStreams[] = [];

	process.on('SIGINT', () => {
		tasks.forEach((task) => task.kill());
	});

	await Promise.all(
		platforms.map(async (platform, index) => {
			const taskLogger = createLogger(platform);

			const task = spawn(
				/^win/.test(process.platform) ? 'pnpm.cmd' : 'pnpm',
				['run', 'test', '--platform', platform, '--port', String(8056 + index), program.args[0]!],
				{
					shell: true,
				},
			);

			tasks.push(task);
			taskLogger.pipe(task.stdout);
			taskLogger.pipe(task.stderr, 'error');

			return new Promise((resolve) => task.on('close', resolve));
		}),
	);

	process.exit();
}

// catches ctrl+c event
process.on('SIGINT', exitHandler);

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
		if (options.wait) await new Promise((resolve) => setTimeout(resolve, Number(options.wait) * 1000));
	}

	logger.info('Bootstraping Database');

	const bootstrap = spawn('node', [join(distFolder, 'cli', 'run.js'), 'bootstrap'], {
		env,
	});

	logger.pipe(bootstrap.stdout, 'debug');
	logger.pipe(bootstrap.stderr, 'error');

	await new Promise((resolve) => bootstrap.on('close', resolve));
	logger.info('Completed Bootstraping Database');
}

const apiLogger = createLogger('api');

let api: ChildProcess | undefined;

let zxp: Promise<string>;

logger.info('Starting Directus');

if (options.flamegraph) {
	zxp = zx({
		argv: [join(distFolder, 'cli', 'run.js'), 'start'],
		workingDir: join(import.meta.dirname, '..'),
		env,
		onProcessStart: (process) => {
			api = process;
		},
		name: 'flamegraph',
		outputDir: 'flamegraph',
	});

	while (!api) {
		await new Promise((r) => setTimeout(r, 100));
	}
} else {
	api = spawn('node', [join(distFolder, 'cli', 'run.js'), 'start'], {
		env,
	});
}

apiLogger.pipe(api.stderr, 'error');

await new Promise((resolve, reject) => {
	api!.stdout!.on('data', (data) => {
		if (!options.flamegraph) apiLogger.debug(String(data));
		if (String(data).includes(`Server started at http://${env.HOST}:${env.PORT}`)) resolve(null);
	});

	// In case the api takes too long to start
	setTimeout(reject, 10000);
});

logger.info('Completed Starting Directus');

if (platform) {
	logger.info('Starting Setup');
	const setupLogger = createLogger('setup');

	const sdk = createDirectus(`http://${env.HOST}:${env.PORT}`).with(rest()).with(staticToken('admin'));

	const setup = await import(`../tests/${program.args[0]!}/setup.js`);
	await setup.setup({ sdk, logger: setupLogger, program });
	logger.info('Completed Setup');
}

let k6: ChildProcessWithoutNullStreams | undefined;

if (!options.debug) {
	const k6Logger = createLogger('k6');

	k6 = spawn(
		'k6',
		[
			'run',
			'-e',
			`HOST=${env.HOST}`,
			'-e',
			`PORT=${env.PORT}`,
			join(import.meta.dirname, '..', 'tests', program.args[0]!, `${options.test}.ts`),
		],
		{
			env: {
				K6_WEB_DASHBOARD: 'true',
				K6_WEB_DASHBOARD_PERIOD: '1s',
			},
		},
	);

	k6Logger.pipe(k6.stdout);
	k6Logger.pipe(k6.stderr, 'error');

	await new Promise((resolve) => k6!.on('close', resolve));

	if (platform) await stopDocker();
	await exitHandler();
}

async function stopDocker() {
	const docker = spawn('docker', [
		'compose',
		'-f',
		join(import.meta.dirname, '..', 'docker', `${platform}.yml`),
		'down',
	]);

	logger.pipe(docker.stdout, 'debug');
	logger.pipe(docker.stderr, 'error');

	await new Promise((resolve) => docker.on('close', resolve));
}

async function exitHandler() {
	if (platform) {
		logger.info('Stoppoing Docker');
		await stopDocker();
	}

	logger.info('Stopping Api');
	api?.stdin?.end();
	api?.kill('SIGINT');

	k6?.stdin.end();
	k6?.kill();

	if (options.flamegraph) {
		const path = await zxp;
		logger.info(`Firegraph visible at ${path.replaceAll('\\', '/')}`);
	}

	logger.info('Bye');
	process.exit();
}
