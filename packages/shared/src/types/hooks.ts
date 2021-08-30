import { ApiExtensionContext } from './extensions';

type HookHandlerFunction = (context: ApiExtensionContext) => Record<string, (...values: any[]) => void>;

export type HookConfig = HookHandlerFunction;
