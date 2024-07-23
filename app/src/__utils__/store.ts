import { _ActionsTree, StateTree, Store } from 'pinia';
import { MockedFunction } from 'vitest';
import { UnwrapRef } from 'vue';

type Mocked<T extends _ActionsTree> = { [P in keyof T]: MockedFunction<T[P]> };

type Mutable<G> = {
	[k in keyof G]: G[k] extends (...args: any[]) => infer R ? R : UnwrapRef<G[k]>;
};

/**
 * Type helper for mocked Pinia stores
 *
 * @see https://github.com/vuejs/pinia/issues/1605
 * @see https://github.com/vuejs/pinia/issues/945
 */
export function mockedStore<Id extends string, S extends StateTree, G, A extends _ActionsTree>(
	store: Store<Id, S, G, A>,
): S & Mutable<G> & Mocked<A> {
	return store;
}
