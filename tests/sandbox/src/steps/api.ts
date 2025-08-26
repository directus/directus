import { spawn } from 'child_process';
import { join } from 'path';
import { type Env } from '../config.js';
import { type Logger } from '../logger.js';
import { apiFolder, type Options } from '../sandbox.js';
import chalk from 'chalk';

export async function buildDirectus(opts: Options, logger: Logger, onRebuild: () => void) {
	logger.info('Rebuilding Directus');

	const watch = opts.watch ? ['--watch'] : [];
	const inspect = opts.inspect ? ['--inspect', '--sourceMap'] : [];

	const build = spawn('pnpm', ['tsc', ...watch, ...inspect, '--project tsconfig.prod.json'], {
		cwd: apiFolder,
		shell: true,
	});

	build.on('error', (err) => {
		build.kill();
		throw err;
	});

	logger.pipe(build.stderr, 'error');

	if (opts.watch) {
		await new Promise((resolve, reject) => {
			build!.stdout!.on('data', (data) => {
				logger.debug(String(data));

				if (String(data).includes(`Watching for file changes.`)) {
					onRebuild();
					resolve(undefined);
				}
			});

			// In case the api takes too long to start
			setTimeout(() => reject(new Error('timeout building directus')), 60_000);
		});

		return build;
	} else {
		logger.pipe(build.stdout);
		await new Promise((resolve) => build.on('close', resolve));
		logger.info('New Build Complete');
		return;
	}
}

export async function bootstrap(env: Env, logger: Logger) {
	logger.info('Bootstraping Database');

	const bootstrap = spawn('node', [join(apiFolder, 'dist', 'cli', 'run.js'), 'bootstrap'], {
		env,
	});

	bootstrap.on('error', (err) => {
		bootstrap.kill();
		throw err;
	});

	logger.pipe(bootstrap.stdout, 'debug');
	logger.pipe(bootstrap.stderr, 'error');

	await new Promise((resolve) => bootstrap.on('close', resolve));
	logger.info('Completed Bootstraping Database');
}

export async function startDirectus(opts: Options, env: Env, logger: Logger) {
	const apiCount = Math.max(1, Number(opts.instances));

	return await Promise.all(
		[...Array(apiCount).keys()].map((i) => {
			const newLogger = apiCount > 1 ? logger.addGroup(`API ${i}`) : logger;
			return startDirectusInstance(opts, { ...env, PORT: String(Number(env.PORT) + i) }, newLogger);
		}),
	);
}

async function startDirectusInstance(opts: Options, env: Env, logger: Logger) {
	logger.info('Starting Directus');
	let api;
	let timeout: NodeJS.Timeout;
	const inspect = opts.watch ? ['--inspect'] : [];

	if (opts.dev) {
		const watch = opts.watch ? ['watch'] : [];

		api = spawn('pnpm ', ['tsx', ...watch, '--clear-screen=false', ...inspect, join(apiFolder, 'src', 'start.ts')], {
			env,
			shell: true,
			stdio: 'overlapped', // Has to be here, only god knows why.
		});
	} else {
		api = spawn('node', [...inspect, join(apiFolder, 'dist', 'cli', 'run.js'), 'start'], {
			env,
		});
	}

	api.on('error', (err) => {
		logger.error(err.toString());
	});

	api.on('close', (code) => {
		const error = new Error(`Api stopped with error code ${code}`);
		clearTimeout(timeout);
		logger.error(error.toString());
		throw error;
	});

	logger.pipe(api.stderr, 'error');

	await new Promise((resolve, reject) => {
		api.stdout.on('data', (data) => {
			const msg = String(data);

			if (msg.includes(`Server started at http://${env.HOST}:${env.PORT}`)) {
				resolve(undefined);
			} else if (msg.includes(`ERROR: Port ${env.PORT} is already in use`)) {
				reject(new Error(msg));
			} else {
				logger.debug(msg);
			}
		});

		// In case the api takes too long to start
		timeout = setTimeout(() => {
			reject(new Error('timeout starting directus'));
		}, 10_000);
	});

	logger.info(`Server started at http://${env.HOST}:${env.PORT}`);

	logger.info(
		`User: ${chalk.cyan(env.ADMIN_EMAIL)} Password: ${chalk.cyan(env.ADMIN_PASSWORD)} Token: ${chalk.cyan(env.ADMIN_TOKEN)}`,
	);

	return api;
}
