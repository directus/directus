import { useEnv } from '@directus/env';

const env = useEnv();

export const lockDrainTimeout = env['TUS_LOCK_DRAIN_TIMEOUT'] ? parseInt(env['TUS_LOCK_DRAIN_TIMEOUT'] as string) : 3000;
