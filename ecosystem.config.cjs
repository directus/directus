module.exports = [
	{
		script: 'cli.js',
		name: 'directus',
		exec_mode: 'cluster',
		instances: 0,
		args: ['start'],
		wait_ready: true,
		kill_timeout: 10000,
		kill_retry_time: 3000,
		max_memory_restart: '1G',
	},
];
