import { inject, InjectionKey, provide, Ref, ref } from 'vue';

const refreshSignalSymbol: InjectionKey<Ref<number>> = Symbol('refresh-signal');

/**
 * Broadcast that the item rendered by this form was re-read from the API, so descendants holding
 * data of their own can pick the change up.
 */
export function provideRefreshSignal(signal: Ref<number>) {
	provide(refreshSignalSymbol, signal);
}

/**
 * Counter that increments whenever the surrounding item is refreshed. Falls back to a constant when
 * no ancestor provides one, in which case it never triggers anything.
 */
export function useRefreshSignal(): Ref<number> {
	return inject(refreshSignalSymbol, () => ref(0), true);
}
