import { spawn } from 'child_process';
import { join } from 'path';
import { type Env } from '../config.js';
import { type Logger } from '../logger.js';
import { apiFolder, type Options } from '../sandbox.js';
import chalk from 'chalk';
import { portToPid } from 'pid-port';
import { createInterface } from 'readline/promises';

export async function buildDirectus(opts: Options, logger: Logger, onRebuild: () => void) {
	const start = performance.now();
	logger.info('Rebuilding Directus');

	let timeout: NodeJS.Timeout;
	const watch = opts.watch ? ['--watch', '--preserveWatchOutput'] : [];
	const inspect = opts.inspect ? ['--sourceMap'] : [];

	const build = spawn('pnpm', ['tsc', ...watch, ...inspect, '--project tsconfig.prod.json'], {
		cwd: apiFolder,
		shell: true,
	});

	build.on('error', (err) => {
		logger.error(err.toString());
	});

	build.on('close', (code) => {
		if (code === null || code === 0) return;
		build.kill();
		const error = new Error(`Building api stopped with error code ${code}`);
		clearTimeout(timeout);
		logger.error(error.toString());
		throw error;
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
			timeout = setTimeout(() => reject(new Error('timeout building directus')), 60_000);
		});

		return build;
	} else {
		logger.pipe(build.stdout);
		await new Promise((resolve) => build.on('close', resolve));
		const time = chalk.gray(`(${Math.round(performance.now() - start) / 1000}ms)`);
		logger.info(`New Build Completed ${time}`);
		return;
	}
}

export async function bootstrap(env: Env, logger: Logger) {
	const start = performance.now();
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
	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);
	logger.info(`Completed Bootstraping Database ${time}`);
}

export async function startDirectus(opts: Options, env: Env, logger: Logger) {
	const apiCount = Math.max(1, Number(opts.instances));

	const apiPorts = [...Array(apiCount).keys()].flatMap((i) => Number(env.PORT) + i * (opts.inspect ? 2 : 1));
	const allPorts = apiPorts.flatMap((port) => (opts.inspect ? [port, port + 1] : [port]));

	const occupiedPorts = (await Promise.allSettled(allPorts.map((port) => portToPid(port))))
		.map((result, i) => (result.status === 'fulfilled' ? [result.value, allPorts[i]] : undefined))
		.filter((val) => val) as [number, number][];

	let killPorts;

	for (const [pid, port] of occupiedPorts) {
		logger.warn(`Port ${port} is occupied by pid ${pid}`);
	}

	if (opts.killPorts) {
		killPorts = true;
	} else {
		if (occupiedPorts.length > 0) {
			const rl = createInterface({ input: process.stdin, output: process.stdout });

			const result = (await rl.question('Would you like to kill all occupying processes? (Y/N) ')).toLowerCase();

			killPorts = result === 'y' || result === 'yes';
		}
	}

	if (killPorts) {
		for (const [pid] of occupiedPorts) {
			try {
				process.kill(pid, 'SIGKILL');
				logger.info(`Killed process ${pid}`);
			} catch (err) {
				logger.error(`Failed to kill process ${pid}: ${(err as Error).message}`);
			}
		}
	}

	return await Promise.all(
		apiPorts.map((port) => {
			const newLogger = apiCount > 1 ? logger.addGroup(`API ${port}`) : logger;
			return startDirectusInstance(opts, { ...env, PORT: String(port) }, newLogger);
		}),
	);
}

async function startDirectusInstance(opts: Options, env: Env, logger: Logger) {
	const start = performance.now();
	logger.info('Starting Directus');
	const debuggerPort = Number(env.PORT) + 1;
	let api;
	let timeout: NodeJS.Timeout;
	const inspect = opts.inspect ? [`--inspect=${debuggerPort}`] : [];

	if (opts.dev) {
		const watch = opts.watch ? ['watch', '--clear-screen=false'] : [];

		api = spawn('pnpm ', ['tsx', ...watch, ...inspect, join(apiFolder, 'src', 'start.ts')], {
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
		if (code === null || code === 0) return;

		const error = new Error(`Api stopped with error code ${code}`);
		clearTimeout(timeout);
		logger.error(error.toString());
		throw error;
	});

	api.stderr.on('data', (data) => {
		const msg = String(data);

		if (msg.startsWith('Debugger listening on ws://')) return;

		if (msg.startsWith('Debugger attached')) {
			logger.info(msg);
			return;
		}

		logger.error(msg);
	});

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
		}, 60_000);
	});

	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);

	logger.info(
		`Server started at http://${env.HOST}:${env.PORT}, Debugger listening on http://${env.HOST}:${debuggerPort} ${time}`,
	);

	logger.info(
		`User: ${chalk.cyan(env.ADMIN_EMAIL)} Password: ${chalk.cyan(env.ADMIN_PASSWORD)} Token: ${chalk.cyan(env.ADMIN_TOKEN)}`,
	);

	return api;
}
