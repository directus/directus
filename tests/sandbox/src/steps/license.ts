import { spawn } from 'child_process';
import { join } from 'path';
import type { Env } from '../config.js';
import type { Logger } from '../logger.js';
import { licenseFolder } from '../sandbox.js';

export async function startLicenseServer(env: Env, logger: Logger) {
	const start = performance.now();
	logger.info('Starting license server');

	const license = spawn('node', [join(licenseFolder, 'dist', 'index.js')], {
		env,
	});

	license.on('error', (err) => {
		license.kill();
		throw err;
	});

	logger.pipe(license.stdout, 'debug');
	logger.pipe(license.stderr, 'debug');

	logger.info(`License server started in ${Math.round(performance.now() - start)}ms`);

	return license;
}
