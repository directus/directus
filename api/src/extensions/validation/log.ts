import { z } from 'zod';

export const EXEC_LOG = z.tuple([z.literal('log'), z.string()]);
