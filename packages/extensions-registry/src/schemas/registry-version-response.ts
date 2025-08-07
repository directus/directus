import { z } from 'zod';

export const RegistryVersionResponse = z.strictObject({
	version: z.string(),
});

export type RegistryVersionResponse = z.infer<typeof RegistryVersionResponse>;
