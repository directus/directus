import type { ResolveInput } from '@directus/license';
import type { Accountability } from '@directus/types';

export type Resolver<K extends keyof ResolveInput> = (
	input: NonNullable<ResolveInput[K]>,
	ctx?: { accountability?: Accountability | undefined },
) => Promise<string[]>;

export type Restorer = (ids: string[], ctx: { accountability: Accountability | null }) => Promise<string[]>;
