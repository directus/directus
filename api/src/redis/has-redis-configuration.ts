export const hasRedisConfiguration = (env: Record<string, string>) => {
	return Object.keys(env).some((key) => key.startsWith('REDIS'));
};
