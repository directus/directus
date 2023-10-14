import type { ZodTuple, z } from 'zod';

export interface Handler<S extends ZodTuple> {
	schema: S;
	handler: (...args: z.infer<S>) => Promise<any>;
}

export const defineHandler = <S extends ZodTuple>(
	schema: S,
	handler: (...args: z.infer<S>) => Promise<any>
): Handler<S> => ({
	schema,
	handler,
});
