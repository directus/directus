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
		instances: parseInt(process.env.PM2_INSTANCES) || 1,
		exec_mode: process.env.PM2_EXEC_MODE ?? 'cluster',
		max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART,

		// Control flow
		min_uptime: parseInt(process.env.PM2_MIN_UPTIME) || undefined,
		listen_timeout: parseInt(process.env.PM2_LISTEN_TIMEOUT) || undefined,
		kill_timeout: parseInt(process.env.PM2_KILL_TIMEOUT) || undefined,
		wait_ready: true,
		max_restarts: parseInt(process.env.PM2_MAX_RESTARTS) || undefined,
		restart_delay: parseInt(process.env.PM2_RESTART_DELAY) || 0,
		autorestart: ['1', 'true'].includes(process.env.PM2_AUTO_RESTART?.toLowerCase()),
	},
];
