import { z } from 'zod';
import { EXTENSION_PKG_KEY } from '../constants/index.js';
import { ExtensionOptions } from './options.js';

export const ExtensionManifest = z.object({
	name: z.string(),
	version: z.string(),
	type: z.union([z.literal('module'), z.literal('commonjs')]).optional(),
	description: z.string().optional(),
	icon: z.string().optional(),
	dependencies: z.record(z.string()).optional(),
	devDependencies: z.record(z.string()).optional(),
	[EXTENSION_PKG_KEY]: ExtensionOptions,
});

export type ExtensionManifest = z.infer<typeof ExtensionManifest>;
