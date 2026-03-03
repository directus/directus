import Redis from 'ioredis';

export async function flushRedis(port: number, host: string) {
	const redis = new Redis({ port, host });

	try {
		await redis.flushdb();
	} finally {
		await redis.quit();
	}
}
