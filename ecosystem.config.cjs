module.exports = [
	{
		script: 'cli.js',
		name: 'directus',
		exec_mode: 'cluster',
		args: ['start'],
		wait_ready: true,
		kill_timeout: process.env.PM2_KILL_TIMEOUT ?? 10000,
		kill_retry_time: process.env.PM2_KILL_RETRY_TIME ?? 3000,
		max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART ?? '1G',
		instances: process.env.PM2_INSTANCES ?? 'max',
		min_uptime: process.env.PM2_MIN_UPTIME,
		listen_timeout: process.env.PM2_LISTEN_TIMEOUT,
	},
];
