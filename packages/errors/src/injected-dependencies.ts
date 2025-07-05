// import { type Env } from '@directus/env'; // Produces a Vite error due to the use of node:fs
type Env = Record<string, unknown>;

type Emitter = {
  emitAction: (event: string | string[], meta: Record<string, any>, context: any) => void
  emitFilter: (event: string | string[], payload: any, meta: Record<string, any>, context: any) => Promise<any>
}

// TODO makeand Emitter exportable like Env
export const injectedDependencies: {
  emitter?: Emitter | undefined,
  env?: Env | undefined,
} = {}

export function injectErrorsDependencies(
  emitter: Emitter,
  env: Env, // Must be injected as @directus/errors is built for Node and Vite
) {
  injectedDependencies.emitter = emitter;
  injectedDependencies.env = env;
}

export function useEmitter() {
  return injectedDependencies.emitter
}

export function useEnv() {
  return injectedDependencies.env
}
