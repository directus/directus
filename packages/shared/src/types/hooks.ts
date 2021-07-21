import { ApiExtensionContext } from './extensions';

export type HookRegisterFunction = (context: ApiExtensionContext) => Record<string, (...values: any[]) => void>;
