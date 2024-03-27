/**
 * pm2 ecosystem options
 * See https://pm2.keymetrics.io/docs/usage/application-declaration/
 *
 * Attributes down below are in order of the above linked documentation
 */
module.exports = [
	{
		// General
		name: 'directus',
		script: 'cli.js',
		args: ['start'],

		// General
		instances: process.env.PM2_INSTANCES ?? 1,
		exec_mode: process.env.PM2_EXEC_MODE ?? 'cluster',
		max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART,

		// Control flow
		min_uptime: process.env.PM2_MIN_UPTIME,
		listen_timeout: process.env.PM2_LISTEN_TIMEOUT,
		kill_timeout: process.env.PM2_KILL_TIMEOUT,
		wait_ready: true,
		max_restarts: process.env.PM2_MAX_RESTARTS,
		restart_delay: process.env.PM2_RESTART_DELAY ?? 0,
		autorestart: process.env.PM2_AUTO_RESTART === 'true',
	},
];
