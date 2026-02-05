import { spawn } from 'child_process';
import chalk from 'chalk';
import type { Logger } from '../logger.js';
import { appFolder, type Env, type Options } from '../sandbox.js';

export async function startApp(opts: Options, env: Env, logger: Logger) {
	const start = performance.now();
	logger.info('Starting App');
	let timeout: NodeJS.Timeout;

	const port = typeof opts.app !== 'boolean' ? opts.app : 8080;

	const app = spawn('pnpm', ['vite', '--host', '--clearScreen false', `--port ${port}`], {
		cwd: appFolder,
		shell: true,
	});

	logger.pipe(app.stdout, 'debug');

	app.on('error', (err) => {
		logger.error(err.toString());
	});

	app.on('close', (code) => {
		if (code === null || code === 0) return;

		const error = new Error(`Api stopped with error code ${code}`);
		clearTimeout(timeout);
		logger.error(error.toString());
		throw error;
	});

	logger.pipe(app.stderr, 'error');

	await new Promise((resolve, reject) => {
		app.stdout.on('data', (data) => {
			const msg = String(data);

			if (msg.includes(`ready in`)) {
				resolve(undefined);
			} else {
				logger.debug(msg);
			}
		});

		// In case the api takes too long to start
		timeout = setTimeout(() => {
			reject(new Error('timeout starting app'));
		}, 60_000);
	});

	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);

	logger.info(`App started at http://${env.HOST}:${port} ${time}`);

	return app;
}
