
type Emitter = {
  emitAction: (event: string | string[], meta: Record<string, any>, context: any) => void
  emitFilter: (event: string | string[], payload: any, meta: Record<string, any>, context: any) => Promise<any>
}

// TODO makeand Emitter exportable like Env
export const injectedDependencies: {
  emitter: Emitter | undefined
} = {
  emitter: undefined,
}

export function injectErrorsDependencies(
  emitter: Emitter,
) {
  injectedDependencies.emitter = emitter;
}

export function useEmitter() {
  return injectedDependencies.emitter
}
